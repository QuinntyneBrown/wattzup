import { DOCUMENT, DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { RIDE_SETTINGS, type RideSound, type RideSoundSource } from '@telo/api';
import { type FreewheelState, nextFreewheel, rideSoundParams } from '../engine/ride-sound';

/** How far ahead ticks are scheduled on the audio clock, and how often the schedule is topped up. */
const AHEAD_S = 0.25;
const PUMP_MS = 50;
/** The voices follow the pedalling with this time constant, so a change never clicks (s). */
const SMOOTH_S = 0.1;
/** The master level follows a sound setting with this one: past 95 % within 100 ms, with no click (L2-163 AC2). */
export const SETTING_S = 0.03;

interface Voice {
  readonly gain: GainNode;
  readonly filter: BiquadFilterNode;
  /** When the next tick is due, on the audio clock; null while it does not tick. */
  next: number | null;
}

interface Voices {
  readonly context: AudioContext;
  readonly master: GainNode;
  readonly tick: AudioBuffer;
  readonly chain: Voice;
  readonly freewheel: Voice;
  readonly wind: Voice;
  readonly tyre: Voice;
  readonly pump: ReturnType<typeof setInterval>;
}

/**
 * `RideSound` on the Web Audio API, after `main`'s RideSound: a chain and a freewheel ticking on the audio clock, and
 * wind and tyres as noise through filters that follow the speed, all into one master level. The audio context is made
 * only while a ride plays and Settings' "Ride sound" is on, and closed when either ends (L2-163 AC3). The master level
 * is the volume while the ride runs, the tab shows and no class video plays over it (with "Mute ride sound under a
 * class video" on), else silence, and follows each change at once (AC2). Released when its owner is destroyed.
 */
@Injectable()
export class WebAudioRideSound implements RideSound {
  private readonly document = inject(DOCUMENT);
  private readonly settings = inject(RIDE_SETTINGS).settings;
  private readonly source = signal<RideSoundSource | null>(null);
  private readonly visible = signal(this.document.visibilityState !== 'hidden');
  private voices: Voices | null = null;

  private freewheel: FreewheelState | null = null;
  private previousCadence: number | null = null;
  private lastKmh = 0;

  constructor() {
    const onVisibility = () => this.visible.set(this.document.visibilityState !== 'hidden');
    this.document.addEventListener('visibilitychange', onVisibility);
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('visibilitychange', onVisibility);
      this.close();
    });
    // A context only while a ride plays with ride sound on (AC3).
    effect(() => {
      const on = this.source() !== null && this.settings().rideSound;
      untracked(() => (on ? this.open() : this.close()));
    });
    // The master level follows the volume, the gate and the video at once (AC2).
    effect(() => {
      const level = this.level();
      untracked(() => this.setMaster(level));
    });
    // The freewheel follows the cadence: it starts when the cadence falls to 0.
    effect(() => {
      const source = this.source();
      const cadence = source?.cadence() ?? null;
      const speed = source?.speedKmh() ?? null;
      untracked(() => {
        this.freewheel = nextFreewheel(this.freewheel, {
          previousCadence: this.previousCadence,
          cadence,
          lastKmh: this.lastKmh,
          now: performance.now(),
        });
        this.previousCadence = cadence;
        if ((speed ?? 0) > 0) this.lastKmh = speed!;
      });
    });
  }

  play(source: RideSoundSource): void {
    this.source.set(source);
  }

  /** Releases the audio context at once, as the ride screen goes. */
  stop(): void {
    this.source.set(null);
    this.close();
  }

  /** The master level, 0 to 1: the volume while audible, else silence. */
  private level(): number {
    const source = this.source();
    const { rideSoundVolume, muteUnderVideo } = this.settings();
    const audible =
      source !== null &&
      source.running() &&
      this.visible() &&
      !(muteUnderVideo && source.videoPlaying());
    return audible ? rideSoundVolume / 100 : 0;
  }

  private open(): void {
    if (this.voices) return;
    const Context = this.document.defaultView?.AudioContext;
    if (!Context) return;
    let context: AudioContext;
    try {
      context = new Context();
    } catch {
      return;
    }
    const master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);
    const noise = noiseBuffer(context);
    const wind = voice(context, master, 'lowpass', 300);
    const tyre = voice(context, master, 'bandpass', 150);
    for (const bed of [wind, tyre]) {
      const source = context.createBufferSource();
      source.buffer = noise;
      source.loop = true;
      source.connect(bed.filter);
      source.start();
    }
    this.voices = {
      context,
      master,
      tick: tickBuffer(context),
      chain: voice(context, master, 'bandpass', 2400),
      freewheel: voice(context, master, 'highpass', 3000),
      wind,
      tyre,
      pump: setInterval(() => this.schedule(), PUMP_MS),
    };
    this.setMaster(untracked(() => this.level()));
    this.schedule();
  }

  private close(): void {
    if (!this.voices) return;
    clearInterval(this.voices.pump);
    void this.voices.context.close();
    this.voices = null;
  }

  private setMaster(level: number): void {
    const voices = this.voices;
    if (!voices) return;
    voices.master.gain.setTargetAtTime(level, voices.context.currentTime, SETTING_S);
  }

  /** Tops up each voice's ticks on the audio clock and moves its level with the pedalling. */
  private schedule(): void {
    const voices = this.voices;
    const source = untracked(this.source);
    if (!voices || !source) return;
    if (voices.context.state === 'suspended') void voices.context.resume();
    const p = untracked(() =>
      rideSoundParams({
        cadence: source.cadence(),
        speedKmh: source.speedKmh(),
        resistance: source.resistance(),
        // The master level carries the volume and the gate; the voices carry the pedalling.
        audible: true,
        volume: 1,
        freewheel: this.freewheel,
        now: performance.now(),
      }),
    );
    this.ticks(voices, voices.chain, p.chain.ticksPerSecond, p.chain.gain);
    this.ticks(voices, voices.freewheel, p.freewheel.clicksPerSecond, p.freewheel.gain);
    this.follow(voices, voices.wind, p.wind.cutoffHz, p.wind.gain);
    this.follow(voices, voices.tyre, p.tyre.centreHz, p.tyre.gain);
  }

  /** Moves a noise bed's filter and gain towards the speed's values. */
  private follow(voices: Voices, bed: Voice, hz: number, gain: number): void {
    const now = voices.context.currentTime;
    bed.filter.frequency.setTargetAtTime(hz, now, SMOOTH_S);
    bed.gain.gain.setTargetAtTime(gain, now, SMOOTH_S);
  }

  /** Schedules a voice's ticks a little ahead on the audio clock and moves its level. */
  private ticks(voices: Voices, v: Voice, perSecond: number, gain: number): void {
    const { context } = voices;
    const now = context.currentTime;
    v.gain.gain.setTargetAtTime(gain, now, SMOOTH_S);
    if (perSecond <= 0 || gain <= 0) {
      v.next = null;
      return;
    }
    let at = v.next === null || v.next < now ? now + 0.02 : v.next;
    while (at < now + AHEAD_S) {
      const tick = context.createBufferSource();
      tick.buffer = voices.tick;
      tick.connect(v.filter);
      tick.start(at);
      at += 1 / perSecond;
    }
    v.next = at;
  }
}

/** A voice: ticks or noise through a filter into a gain, into the master level. */
function voice(context: AudioContext, master: GainNode, type: BiquadFilterType, hz: number): Voice {
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = hz;
  const gain = context.createGain();
  gain.gain.value = 0;
  filter.connect(gain).connect(master);
  return { gain, filter, next: null };
}

/** 12 ms of noise that dies away fast: one tick of the chain or the freewheel's pawl. */
function tickBuffer(context: AudioContext): AudioBuffer {
  const length = Math.round(context.sampleRate * 0.012);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 1;
  for (let i = 0; i < length; i++) {
    seed = (seed * 16807) % 2147483647;
    data[i] = ((seed / 2147483647) * 2 - 1) * Math.exp(-i / (length / 5));
  }
  return buffer;
}

/** 2 s of white noise, looped: the bed under the wind and the tyres. */
function noiseBuffer(context: AudioContext): AudioBuffer {
  const length = context.sampleRate * 2;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 7;
  for (let i = 0; i < length; i++) {
    seed = (seed * 16807) % 2147483647;
    data[i] = (seed / 2147483647) * 2 - 1;
  }
  return buffer;
}

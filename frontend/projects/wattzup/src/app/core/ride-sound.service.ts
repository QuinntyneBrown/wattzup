// Ride sound (L2-129): a chain and a freewheel generated with Web Audio from the live state. Off on
// every page load; the AudioContext is made in the rider's press, as the browser requires. The
// numbers come from rideSoundParams(); this service only plays them.
import { DOCUMENT, DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { CueService } from './cue.service';
import { LiveStateService } from './live-state.service';
import { RideSoundPreference } from './ride-sound-preference';
import {
  type FreewheelState,
  nextFreewheel,
  type RideSoundParams,
  rideSoundParams,
} from './ride-sound';

/** How far ahead ticks are scheduled on the audio clock, and how often the schedule is topped up. */
const AHEAD_S = 0.25;
const PUMP_MS = 50;
/** Gains move with this time constant, so a change never clicks (s). */
const SMOOTH_S = 0.1;
/** Ride sound stays ducked this long after a beep ends (AC7). */
const DUCK_TAIL_MS = 150;

interface TickVoice {
  readonly gain: GainNode;
  readonly filter: BiquadFilterNode;
  /** When the next tick is due, on the audio clock; null while it does not tick. */
  next: number | null;
}

@Injectable({ providedIn: 'root' })
export class RideSound {
  private readonly live = inject(LiveStateService);
  private readonly document = inject(DOCUMENT);
  private readonly preference = inject(RideSoundPreference);
  private readonly cues = inject(CueService);
  /** Percent, 0 to 100, kept in this browser (AC3). */
  readonly volume = this.preference.volume;
  private readonly _videoPlaying = signal(false);
  /** A ride-along video is playing: ride sound is silent, though still on (AC8). */
  readonly videoPlaying = this._videoPlaying.asReadonly();
  /** Ducked until this time (ms, performance.now()). */
  private duckedUntil = 0;
  private readonly _on = signal(false);
  /** Off on every page load (AC1). */
  readonly on = this._on.asReadonly();

  private readonly visible = signal(this.document.visibilityState !== 'hidden');
  private context: AudioContext | null = null;
  private tick: AudioBuffer | null = null;
  private chain: TickVoice | null = null;
  private freewheelVoice: TickVoice | null = null;
  /** Wind and tyre: one looped noise bed each, through a filter that follows the speed (AC6). */
  private wind: TickVoice | null = null;
  private tyre: TickVoice | null = null;
  private pump: ReturnType<typeof setInterval> | null = null;

  private freewheel: FreewheelState | null = null;
  private previousCadence: number | null = null;
  private lastKmh = 0;

  constructor() {
    const onVisibility = () => this.visible.set(this.document.visibilityState !== 'hidden');
    this.document.addEventListener('visibilitychange', onVisibility);
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('visibilitychange', onVisibility);
      this.turnOff();
    });
    // Each beep ducks the sound for its length and 0.15 s more (AC7).
    effect(() => {
      const beep = this.cues.beeped();
      if (beep) untracked(() => this.duck(beep.seconds));
    });
    // The freewheel follows each live state: it starts when the cadence falls to 0 (AC5).
    effect(() => {
      const state = this.live.state();
      untracked(() => {
        const cadence = state?.cadence ?? null;
        this.freewheel = nextFreewheel(this.freewheel, {
          previousCadence: this.previousCadence,
          cadence,
          lastKmh: this.lastKmh,
          now: performance.now(),
        });
        this.previousCadence = cadence;
        if ((state?.speed_kmh ?? 0) > 0) this.lastKmh = state!.speed_kmh!;
      });
    });
  }

  /** Call inside the rider's press: the browser allows sound only then (AC2). */
  turnOn(): void {
    if (this._on()) return;
    try {
      this.context = new AudioContext();
    } catch {
      return;
    }
    const ctx = this.context;
    this.tick = tickBuffer(ctx);
    this.chain = voice(ctx, 'bandpass', 2400);
    this.freewheelVoice = voice(ctx, 'highpass', 3000);
    const noise = noiseBuffer(ctx);
    this.wind = voice(ctx, 'lowpass', 300);
    this.tyre = voice(ctx, 'bandpass', 150);
    for (const bed of [this.wind, this.tyre]) {
      const source = ctx.createBufferSource();
      source.buffer = noise;
      source.loop = true;
      source.connect(bed.filter);
      source.start();
    }
    this._on.set(true);
    this.pump = setInterval(() => this.schedule(), PUMP_MS);
    this.schedule();
  }

  setVolume(percent: number): void {
    this.preference.setVolume(percent);
    this.schedule();
  }

  setVideoPlaying(playing: boolean): void {
    this._videoPlaying.set(playing);
    this.schedule();
  }

  /** Holds every voice at 30 % for `seconds` and 0.15 s after (AC7). */
  duck(seconds: number): void {
    this.duckedUntil = Math.max(
      this.duckedUntil,
      performance.now() + seconds * 1000 + DUCK_TAIL_MS,
    );
    this.schedule();
  }

  turnOff(): void {
    if (this.pump !== null) clearInterval(this.pump);
    this.pump = null;
    void this.context?.close();
    this.context = null;
    this.chain = this.freewheelVoice = this.wind = this.tyre = null;
    this._on.set(false);
  }

  /** The voices' numbers now: silent unless a ride runs, the tab shows and the bike is there. */
  private params(): RideSoundParams {
    const state = this.live.state();
    const audible =
      this.visible() &&
      !this._videoPlaying() &&
      state?.workout?.status === 'running' &&
      state.ble === 'connected';
    const now = performance.now();
    return rideSoundParams({
      cadence: state?.cadence ?? null,
      speedKmh: state?.speed_kmh ?? null,
      resistance: state?.resistance ?? null,
      audible,
      volume: this.preference.volume() / 100,
      freewheel: this.freewheel,
      ducked: now < this.duckedUntil,
      now,
    });
  }

  /** Tops up each voice's ticks on the audio clock and moves its gain (AC4, AC5, AC9). */
  private schedule(): void {
    const ctx = this.context;
    if (!ctx || !this.chain || !this.freewheelVoice || !this.wind || !this.tyre || !this.tick) {
      return;
    }
    if (ctx.state === 'suspended') void ctx.resume();
    if (this.freewheel && performance.now() - this.freewheel.startedAt >= 3000) {
      this.freewheel = null;
    }
    const p = untracked(() => this.params());
    this.play(this.chain, p.chain.ticksPerSecond, p.chain.gain);
    this.play(this.freewheelVoice, p.freewheel.clicksPerSecond, p.freewheel.gain);
    this.follow(this.wind, p.wind.cutoffHz, p.wind.gain);
    this.follow(this.tyre, p.tyre.centreHz, p.tyre.gain);
  }

  /** Moves a noise bed's filter and gain towards the speed's values (AC6). */
  private follow(bed: TickVoice, hz: number, gain: number): void {
    const now = this.context!.currentTime;
    bed.filter.frequency.setTargetAtTime(hz, now, SMOOTH_S);
    bed.gain.gain.setTargetAtTime(gain, now, SMOOTH_S);
  }

  private play(v: TickVoice, perSecond: number, gain: number): void {
    const ctx = this.context!;
    const now = ctx.currentTime;
    v.gain.gain.setTargetAtTime(gain, now, SMOOTH_S);
    if (perSecond <= 0 || gain <= 0) {
      v.next = null;
      return;
    }
    let at = v.next === null || v.next < now ? now + 0.02 : v.next;
    while (at < now + AHEAD_S) {
      const source = ctx.createBufferSource();
      source.buffer = this.tick;
      source.connect(v.filter);
      source.start(at);
      at += 1 / perSecond;
    }
    v.next = at;
  }
}

/** A voice: ticks through a filter into a gain that rides the volume. */
function voice(ctx: AudioContext, type: BiquadFilterType, hz: number): TickVoice {
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = hz;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  filter.connect(gain).connect(ctx.destination);
  return { gain, filter, next: null };
}

/** 12 ms of noise that dies away fast: one tick of the chain or the freewheel's pawl. */
function tickBuffer(ctx: AudioContext): AudioBuffer {
  const length = Math.round(ctx.sampleRate * 0.012);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 1;
  for (let i = 0; i < length; i++) {
    seed = (seed * 16807) % 2147483647;
    data[i] = ((seed / 2147483647) * 2 - 1) * Math.exp(-i / (length / 5));
  }
  return buffer;
}

/** 2 s of white noise, looped: the bed under the wind and the tyres. */
function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 7;
  for (let i = 0; i < length; i++) {
    seed = (seed * 16807) % 2147483647;
    data[i] = (seed / 2147483647) * 2 - 1;
  }
  return buffer;
}

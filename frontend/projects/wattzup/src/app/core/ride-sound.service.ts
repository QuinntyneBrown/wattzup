// Ride sound (L2-129): a chain and a freewheel generated with Web Audio from the live state. Off on
// every page load; the AudioContext is made in the rider's press, as the browser requires. The
// numbers come from rideSoundParams(); this service only plays them.
import { DOCUMENT, DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { LiveStateService } from './live-state.service';
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
const VOLUME = 0.6;

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
  private readonly _on = signal(false);
  /** Off on every page load (AC1). */
  readonly on = this._on.asReadonly();

  private readonly visible = signal(this.document.visibilityState !== 'hidden');
  private context: AudioContext | null = null;
  private tick: AudioBuffer | null = null;
  private chain: TickVoice | null = null;
  private freewheelVoice: TickVoice | null = null;
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
    this._on.set(true);
    this.pump = setInterval(() => this.schedule(), PUMP_MS);
    this.schedule();
  }

  turnOff(): void {
    if (this.pump !== null) clearInterval(this.pump);
    this.pump = null;
    void this.context?.close();
    this.context = null;
    this.chain = this.freewheelVoice = null;
    this._on.set(false);
  }

  /** The voices' numbers now: silent unless a ride runs, the tab shows and the bike is there. */
  private params(): RideSoundParams {
    const state = this.live.state();
    const audible =
      this.visible() && state?.workout?.status === 'running' && state.ble === 'connected';
    return rideSoundParams({
      cadence: state?.cadence ?? null,
      speedKmh: state?.speed_kmh ?? null,
      resistance: state?.resistance ?? null,
      audible,
      volume: VOLUME,
      freewheel: this.freewheel,
      now: performance.now(),
    });
  }

  /** Tops up each voice's ticks on the audio clock and moves its gain (AC4, AC5, AC9). */
  private schedule(): void {
    const ctx = this.context;
    if (!ctx || !this.chain || !this.freewheelVoice || !this.tick) return;
    if (ctx.state === 'suspended') void ctx.resume();
    if (this.freewheel && performance.now() - this.freewheel.startedAt >= 3000) {
      this.freewheel = null;
    }
    const p = untracked(() => this.params());
    this.play(this.chain, p.chain.ticksPerSecond, p.chain.gain);
    this.play(this.freewheelVoice, p.freewheel.clicksPerSecond, p.freewheel.gain);
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

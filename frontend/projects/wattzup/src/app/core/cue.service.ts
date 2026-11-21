// Countdown beeps: off on every page load, turned on by the rider (L2-027). The AudioContext
// is created on that press, the user gesture browsers require.
import { Injectable, inject, signal } from '@angular/core';
import { ToastService } from './toast.service';

export const TONES = {
  confirm: { frequency: 880, seconds: 0.35 },
  work: { frequency: 990, seconds: 0.35 },
  change: { frequency: 520, seconds: 0.35 },
  countdown: { frequency: 660, seconds: 0.09 },
} as const;

export type ToneName = keyof typeof TONES;

@Injectable({ providedIn: 'root' })
export class CueService {
  private readonly toasts = inject(ToastService);
  private readonly _beeps = signal(false);
  readonly beeps = this._beeps.asReadonly();
  private context: AudioContext | null = null;
  private readonly _beeped = signal<{ seconds: number } | null>(null);
  /** Set each time a tone plays; ride sound ducks under it (L2-129 AC7). */
  readonly beeped = this._beeped.asReadonly();

  toggle(): void {
    if (this._beeps()) {
      this._beeps.set(false);
      return;
    }
    this._beeps.set(true);
    this.play('confirm');
    this.toasts.show({
      tone: 'info',
      title: 'Beeps on',
      text: "You'll hear a tone at each interval change and in the last 3 seconds.",
    });
  }

  /** Plays a tone when beeps are on. */
  play(name: ToneName): void {
    if (!this._beeps()) return;
    const ctx = this.audio();
    if (!ctx) return;
    const { frequency, seconds } = TONES[name];
    const start = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + seconds);
    this._beeped.set({ seconds });
  }

  private audio(): AudioContext | null {
    if (!this.context) {
      try {
        this.context = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { HeartRateSource } from './heart-rate-source';

/**
 * A ride's average and peak heart rate (L2-031 AC5), kept with the ride when it is saved. On each running second it
 * takes in the heart rate shown, skipping seconds without one; it holds a sum, a count and a peak, never a trace, so
 * it stays the same size however long the ride.
 */
@Injectable()
export class HeartRateStats {
  private readonly source = inject(HeartRateSource);
  private readonly sum = signal(0);
  private readonly count = signal(0);
  private readonly highest = signal<number | null>(null);

  readonly average = computed(() =>
    this.count() === 0 ? null : Math.round(this.sum() / this.count()),
  );
  readonly peak = this.highest.asReadonly();

  onRunningSecond(): void {
    const bpm = this.source.bpm();
    if (bpm === null) return;
    this.sum.update((sum) => sum + bpm);
    this.count.update((count) => count + 1);
    this.highest.update((peak) => (peak === null ? bpm : Math.max(peak, bpm)));
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { MONOTONIC_TIME } from '@telo/api';

/**
 * The ride clock: the monotonic time since `start()`, less the time paused (L2-133 AC1). It never counts timer ticks,
 * so a throttled hidden tab cannot make it fall behind (docs/detailed-designs/performance/keep-the-ride-clock-true).
 * Provided by each ride screen.
 */
@Injectable()
export class RideClock {
  private readonly time = inject(MONOTONIC_TIME);
  private startedAt: number | null = null;
  private pausedAt: number | null = null;
  private pausedTotalMs = 0;
  private readonly isRunning = signal(false);

  readonly running = this.isRunning.asReadonly();

  /**
   * Starts the clock now, or from `at`, a monotonic moment that may be past: a group ride starts from its session's
   * start, so every rider's clock reads the same at the same server time (L2-122 AC3).
   */
  start(at: number = this.time.now()): void {
    this.startedAt = at;
    this.pausedAt = null;
    this.pausedTotalMs = 0;
    this.isRunning.set(true);
  }

  pause(): void {
    if (!this.isRunning()) return;
    this.pausedAt = this.time.now();
    this.isRunning.set(false);
  }

  resume(): void {
    if (this.pausedAt === null) return;
    this.pausedTotalMs += this.time.now() - this.pausedAt;
    this.pausedAt = null;
    this.isRunning.set(true);
  }

  elapsedMs(): number {
    if (this.startedAt === null) return 0;
    return (this.pausedAt ?? this.time.now()) - this.startedAt - this.pausedTotalMs;
  }
}

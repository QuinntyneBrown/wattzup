// Local interpolation between the once-per-second state updates (L2-024).
import type { WorkoutSnapshot } from '@wattzup/api';

const CAP_SECONDS = 1.25;

/**
 * Quantizes a `[0, 1]` progress ratio into `0.5%` CSS percentage steps (`~1.3 px` on a 272 px bar)
 * so 60 Hz animation frames coalesce via `Object.is` instead of forcing 60 DOM layouts per second.
 */
export function progressWidth(progress: number): string {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return `${Math.round(clamped * 200) / 2}%`;
}

export class CountdownClock {
  private remaining = 0;
  private elapsed = 0;
  private total = 0;
  private duration = 0;
  private running = false;
  private at = 0;

  anchor(workout: WorkoutSnapshot | null, now: number): void {
    this.remaining = workout?.remaining ?? 0;
    this.elapsed = workout?.elapsed_seconds ?? 0;
    this.total = workout?.total_seconds ?? 0;
    this.duration = workout?.segments[workout.segment]?.duration ?? 0;
    this.running = workout?.status === 'running';
    this.at = now;
  }

  drift(now: number): number {
    return this.running ? Math.min(CAP_SECONDS, Math.max(0, (now - this.at) / 1000)) : 0;
  }

  remainingAt(now: number): number {
    return Math.max(0, this.remaining - this.drift(now));
  }

  elapsedAt(now: number): number {
    return Math.min(this.total, this.elapsed + this.drift(now));
  }

  progressAt(now: number): number {
    return this.duration > 0 ? (this.duration - this.remainingAt(now)) / this.duration : 0;
  }
}

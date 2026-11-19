// Turns streamed workout states into segment changes; the first state never cues (L2-027).
import type { SegmentKind, WorkoutSnapshot } from '@wattzup/api';
import { roundCount } from './segment-labels';

export interface SegmentChange {
  kind: SegmentKind;
  level: number;
  duration: number;
  round: number | null;
  rounds: number;
  last: boolean;
  next: { kind: SegmentKind; level: number } | null;
}

export class SegmentChangeDetector {
  private seen = false;
  private key: string | null = null;

  observe(workout: WorkoutSnapshot | null): SegmentChange | null {
    const key = workout ? `${workout.summary}|${workout.total_seconds}|${workout.segment}` : null;
    const first = !this.seen;
    const changed = key !== this.key;
    this.seen = true;
    this.key = key;
    if (first || !changed || !workout) return null;
    const segment = workout.segments[workout.segment];
    if (!segment) return null;
    const next = workout.segments[workout.segment + 1];
    return {
      kind: segment.kind,
      level: segment.level,
      duration: segment.duration,
      round: segment.round,
      rounds: roundCount(workout.segments),
      last: !next,
      next: next ? { kind: next.kind, level: next.level } : null,
    };
  }
}

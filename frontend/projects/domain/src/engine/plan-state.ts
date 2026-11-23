import type { Plan, Segment } from '@telo/api';
import { PowerModel } from './power-model';

/** Where a plan stands at one moment of the ride clock. */
export interface PlanState {
  readonly index: number;
  readonly segment: Segment;
  /** Milliseconds left in the segment. */
  readonly remainingMs: number;
  /** How much of the segment has passed, 0 to 1. */
  readonly progress: number;
  /** The segment's target power in watts (L2-023 AC3). */
  readonly targetPower: number;
}

/**
 * The plan's segment at `elapsedMs` of the ride clock, with its time left, progress and target power, or `null` once
 * the plan has ended. A pure function of the plan, so a late tick still lands on the right segment
 * (docs/detailed-designs/performance/keep-the-ride-clock-true, L2-133 AC2).
 */
export function planStateAt(plan: Plan, elapsedMs: number): PlanState | null {
  let start = 0;
  for (const [index, segment] of plan.segments.entries()) {
    const durationMs = segment.duration * 1000;
    const into = elapsedMs - start;
    if (into < durationMs) {
      return {
        index,
        segment,
        remainingMs: durationMs - into,
        progress: into / durationMs,
        targetPower: PowerModel.target(segment.cadenceAim, segment.level),
      };
    }
    start += durationMs;
  }
  return null;
}

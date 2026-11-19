// The frontend's single implementation of the plan rules (L2-045, L2-060, L2-049),
// mirroring PlanExpander, WorkoutSummary and PowerEstimator in Wattzup.Core.
import type { IntervalsPlan, Segment, WorkoutPlan } from '@wattzup/api';
import { formatDuration } from './format-duration';

export const WARMUP_SECONDS = 180;
export const COOLDOWN_SECONDS = 120;
/** Cadence aims of a `hiit` plan's segments, in rpm (L2-045). */
export const WARMUP_CADENCE = 80;
export const WORK_CADENCE = 100;
export const REST_CADENCE = 72;
export const COOLDOWN_CADENCE = 70;
/** The number of efforts in an intervals plan: the rounds of every set. */
export function effortCount(plan: IntervalsPlan): number {
  return plan.sets.reduce((sum, s) => sum + s.rounds, 0);
}

/** Expands an intervals plan; rounds run across sets (L2-045 criteria 7 and 8). */
function expandIntervalsPlan(plan: IntervalsPlan): Segment[] {
  const segments: Segment[] = [];
  let start = 0;
  const push = (s: Omit<Segment, 'start'>): void => {
    segments.push({ ...s, start });
    start += s.duration;
  };
  const { warmup, cooldown } = plan;
  if (warmup) {
    push({
      kind: 'warmup',
      duration: warmup.seconds,
      level: warmup.level,
      cadence: warmup.cadence,
      round: null,
    });
  }
  let effort = 0;
  for (const set of plan.sets) {
    for (let i = 0; i < set.rounds; i++) {
      effort++;
      push({
        kind: 'work',
        duration: set.work_seconds,
        level: set.work_level,
        cadence: set.work_cadence,
        round: effort,
      });
      if (set.rest_seconds > 0) {
        push({
          kind: 'rest',
          duration: set.rest_seconds,
          level: set.rest_level,
          cadence: set.rest_cadence,
          round: effort,
        });
      }
    }
  }
  if (cooldown) {
    push({
      kind: 'cooldown',
      duration: cooldown.seconds,
      level: cooldown.level,
      cadence: cooldown.cadence,
      round: null,
    });
  }
  return segments;
}

export function expandPlan(plan: WorkoutPlan): Segment[] {
  if (plan.kind === 'intervals') return expandIntervalsPlan(plan);
  if (plan.kind === 'flat') {
    return [
      {
        kind: 'steady',
        start: 0,
        duration: plan.minutes * 60,
        level: plan.level,
        cadence: plan.cadence,
        round: null,
      },
    ];
  }
  const segments: Segment[] = [];
  let start = 0;
  const push = (s: Omit<Segment, 'start'>): void => {
    segments.push({ ...s, start });
    start += s.duration;
  };
  const restLevel = plan.rest_level;
  if (plan.warmup) {
    push({
      kind: 'warmup',
      duration: WARMUP_SECONDS,
      level: Math.max(1, restLevel + 2),
      cadence: WARMUP_CADENCE,
      round: null,
    });
  }
  for (let round = 1; round <= plan.rounds; round++) {
    push({
      kind: 'work',
      duration: plan.work_seconds,
      level: plan.work_level,
      cadence: WORK_CADENCE,
      round,
    });
    if (!(plan.cooldown && round === plan.rounds)) {
      push({
        kind: 'rest',
        duration: plan.rest_seconds,
        level: plan.rest_level,
        cadence: REST_CADENCE,
        round,
      });
    }
  }
  if (plan.cooldown) {
    push({
      kind: 'cooldown',
      duration: COOLDOWN_SECONDS,
      level: Math.max(1, restLevel),
      cadence: COOLDOWN_CADENCE,
      round: null,
    });
  }
  return segments;
}

export function totalSeconds(segments: readonly Segment[]): number {
  return segments.reduce((sum, s) => sum + s.duration, 0);
}

export function planSummary(plan: WorkoutPlan): string {
  if (plan.kind === 'intervals') {
    const n = effortCount(plan);
    return `Intervals · ${n} ${n === 1 ? 'effort' : 'efforts'} · ${formatDuration(totalSeconds(expandPlan(plan)))}`;
  }
  if (plan.kind === 'flat') {
    return `Flat · Level ${plan.level} · ${plan.minutes} min`;
  }
  if (plan.work_seconds < 60) {
    return `HIIT · ${plan.rounds} × ${plan.work_seconds}s / ${plan.rest_seconds}s`;
  }
  return `HIIT · ${plan.rounds} × ${formatDuration(plan.work_seconds)} / ${formatDuration(plan.rest_seconds)}`;
}

/** Estimated watts: max(0, round(cadence × (0.55 + level × 0.155))) (ADR 0003). */
export function estimateWatts(cadence: number, level: number): number {
  return Math.max(0, Math.round(cadence * (0.55 + level * 0.155)));
}

/** Time-weighted mean target power over the segments. */
export function averageTargetPower(segments: readonly Segment[]): number {
  const total = totalSeconds(segments);
  if (total === 0) return 0;
  const sum = segments.reduce((acc, s) => acc + estimateWatts(s.cadence, s.level) * s.duration, 0);
  return Math.round(sum / total);
}

/** kcal = round(avg power × seconds ÷ 1000 ÷ 0.24 ÷ 4.184) (L2-049). */
export function energyKcal(avgPower: number, seconds: number): number {
  return Math.round((avgPower * seconds) / 1000 / 0.24 / 4.184);
}

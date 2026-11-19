// The "Power vs. plan" scene, independent of how it is drawn (L2-026).
import type { WorkoutSnapshot } from '@wattzup/api';
import { formatDuration } from './format-duration';
import { averageTargetPower, estimateWatts } from './plan-expansion';

export type TracePhase = 'work' | 'rest' | 'easy';

export interface TraceBlock {
  start: number;
  end: number;
  /** The target, in watts. */
  value: number;
  phase: TracePhase;
  past: boolean;
}

export interface TraceTick {
  label: string;
  percent: number;
}

export interface TraceScene {
  title: string;
  total: number;
  elapsed: number;
  yMax: number;
  /** Grid lines every this many units below `yMax`. */
  gridStep: number;
  /** The plot's top label, `300 W`. */
  maxLabel: string;
  blocks: TraceBlock[];
  ticks: TraceTick[];
  planAverage: number;
  legend: string[];
}

const STEPS_MINUTES = [2, 5, 10, 15, 30, 60];

export function yMaxFor(maxTarget: number): number {
  return Math.max(300, Math.ceil((maxTarget * 1.3) / 100) * 100);
}

export function tickStep(total: number): number {
  for (const m of STEPS_MINUTES) {
    if (Math.floor(total / (m * 60)) + 1 <= 8) return m * 60;
  }
  return 3600;
}

/** A labelled tick every `step` seconds from 0:00. */
export function traceTicks(total: number, step: number): TraceTick[] {
  const ticks: TraceTick[] = [];
  for (let t = 0; t <= total; t += step) {
    ticks.push({ label: formatDuration(t), percent: total > 0 ? (t / total) * 100 : 0 });
  }
  return ticks;
}

/** The tone of a segment's block. */
export function phaseOfKind(kind: string): TracePhase {
  return kind === 'work' || kind === 'steady' ? 'work' : kind === 'rest' ? 'rest' : 'easy';
}

export function traceGeometry(workout: WorkoutSnapshot, elapsed: number): TraceScene {
  const total = workout.total_seconds;
  const blocks = workout.segments.map((s) => ({
    start: s.start,
    end: s.start + s.duration,
    value: estimateWatts(s.cadence, s.level),
    phase: phaseOfKind(s.kind),
    past: s.start + s.duration <= elapsed,
  }));
  const yMax = yMaxFor(Math.max(0, ...blocks.map((b) => b.value)));
  return {
    title: 'Power vs. plan',
    total,
    elapsed,
    yMax,
    gridStep: 100,
    maxLabel: `${yMax} W`,
    blocks,
    ticks: traceTicks(total, tickStep(total)),
    planAverage: averageTargetPower(workout.segments),
    legend:
      workout.plan.kind !== 'flat'
        ? ['Actual', 'Work target', 'Recover']
        : ['Actual', 'Work target'],
  };
}

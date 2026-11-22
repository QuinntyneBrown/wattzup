import type { CustomWorkoutDraft, Plan, Segment } from '@telo/api';
import { EnergyModel } from './energy-model';
import { PlanSummary } from './plan-summary';

/** The cadence each kind of a custom workout's segment aims at (L2-096 AC3, L2-102 AC1). */
export const CUSTOM_CADENCE_AIMS = { warmUp: 80, work: 90, recover: 72, coolDown: 85 } as const;

/** The warm-up's level (L2-096 AC3). */
const WARM_UP_LEVEL = 8;

/**
 * A custom workout as the segments the ride follows (L2-100 AC1): HIIT is a warm-up at level 8, then each round's
 * effort at the work level and, but after the last round, its recovery at the recover level, then a cool-down at the
 * recover level, a warm-up or cool-down of 0:00 left out; flat is one steady segment at its level and cadence goal.
 */
export function expandCustomWorkout(draft: CustomWorkoutDraft): Plan {
  if (draft.mode === 'flat') {
    const { level, minutes, cadence } = draft.flat;
    return { segments: [{ kind: 'steady', duration: minutes * 60, level, cadenceAim: cadence }] };
  }
  const aims = CUSTOM_CADENCE_AIMS;
  const segments: Segment[] = [];
  if (draft.warmUp > 0) {
    segments.push({
      kind: 'warm-up',
      duration: draft.warmUp,
      level: WARM_UP_LEVEL,
      cadenceAim: aims.warmUp,
    });
  }
  draft.rounds.forEach((round, i) => {
    segments.push({
      kind: 'work',
      duration: round.effort,
      level: draft.workLevel,
      cadenceAim: aims.work,
    });
    if (i < draft.rounds.length - 1) {
      segments.push({
        kind: 'recover',
        duration: round.recovery,
        level: draft.recoverLevel,
        cadenceAim: aims.recover,
      });
    }
  });
  if (draft.coolDown > 0) {
    segments.push({
      kind: 'cool-down',
      duration: draft.coolDown,
      level: draft.recoverLevel,
      cadenceAim: aims.coolDown,
    });
  }
  return { segments };
}

/** A rule a plan breaks (L2-100 AC3). */
export type PlanProblem = 'segment-too-short' | 'level-out-of-range' | 'total-out-of-range';

/** The rules `plan` breaks: every segment at least 5 seconds, every level 1 to 32, the total 1 to 180 minutes. */
export function validatePlan(plan: Plan): readonly PlanProblem[] {
  const problems: PlanProblem[] = [];
  const total = planLength(plan);
  if (plan.segments.some((segment) => segment.duration < 5)) problems.push('segment-too-short');
  if (plan.segments.some((segment) => segment.level < 1 || segment.level > 32)) {
    problems.push('level-out-of-range');
  }
  if (total < 60 || total > 180 * 60) problems.push('total-out-of-range');
  return problems;
}

export function planLength(plan: Plan): number {
  return plan.segments.reduce((total, segment) => total + segment.duration, 0);
}

/** One line of "Your ride": its name and what it reads. */
export interface PreviewFact {
  readonly name: string;
  readonly value: string;
}

/** "Your ride" (L2-099): the plan's length in seconds and its facts, in the preview's order. */
export interface CustomWorkoutPreview {
  readonly totalSeconds: number;
  readonly facts: readonly PreviewFact[];
}

const clock = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * What "Your ride" reads of a custom workout (L2-099 AC1 to AC3, AC5): the structure, the time under load (HIIT only),
 * the video, the peak resistance, the expected average power (each segment's target power weighted by its duration)
 * and the energy that power burns over the plan (L2-023 AC4).
 */
export function customWorkoutPreview(
  draft: CustomWorkoutDraft,
  plan: Plan,
  video: string,
): CustomWorkoutPreview {
  const totalSeconds = planLength(plan);
  const power = PlanSummary.averagePower(plan.segments);
  const peak = Math.max(...plan.segments.map((segment) => segment.level));
  const underLoad = plan.segments
    .filter((segment) => segment.kind === 'work')
    .reduce((total, segment) => total + segment.duration, 0);
  const facts: PreviewFact[] = [{ name: 'Structure', value: PlanSummary.structure(plan.segments) }];
  if (draft.mode === 'hiit') facts.push({ name: 'Time under load', value: clock(underLoad) });
  facts.push(
    { name: 'Video', value: video },
    { name: 'Peak resistance', value: `Level ${peak}` },
    { name: 'Expected avg power', value: `~${power} W` },
    { name: 'Expected energy', value: `~${EnergyModel.kcal(power, totalSeconds)} kcal` },
  );
  return { totalSeconds, facts };
}

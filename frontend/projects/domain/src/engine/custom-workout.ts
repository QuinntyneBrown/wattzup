import type { CustomWorkoutDraft, HiitPresetId, Round, TrainingMode } from '@telo/api';
import {
  DEFAULT_VIDEO_LINK,
  OFFSET_STEP,
  clampOffset,
  formatOffset,
  videoIdOf,
} from './video-link';

/** A HIIT plan: its chip, its ladder's title and its rounds (L2-095 AC1, AC2, AC7). */
export interface HiitPreset {
  readonly id: HiitPresetId;
  readonly name: string;
  readonly title: string;
  readonly rounds: readonly Round[];
}

const rounds = (count: number, effort: number, recovery: number): Round[] =>
  Array.from({ length: count }, () => ({ effort, recovery }));

/** The plans in their chips' order. GCN 30-min HIIT's last recovery runs into the cool-down, as every plan's does. */
export const HIIT_PRESETS: readonly HiitPreset[] = [
  {
    id: 'gcn30',
    name: 'GCN 30-min HIIT',
    title: 'GCN 30-min HIIT · GCN Training',
    rounds: [180, 150, 150, 120, 120, 90, 90, 90].map((recovery) => ({ effort: 30, recovery })),
  },
  { id: 'tabata', name: 'Tabata', title: 'Tabata · Telo Ride', rounds: rounds(8, 20, 15) },
  { id: 'forty-twenty', name: '40 / 20', title: '40 / 20 · Telo Ride', rounds: rounds(10, 40, 20) },
  {
    id: 'minute-on',
    name: 'Minute on',
    title: 'Minute on · Telo Ride',
    rounds: rounds(10, 60, 60),
  },
  {
    id: 'long-climbs',
    name: 'Long climbs',
    title: 'Long climbs · Telo Ride',
    rounds: rounds(4, 300, 180),
  },
];

/** The steps and bounds of every custom workout setting (L2-095 AC3, AC4; L2-096; L2-097 AC2). */
export const CUSTOM_WORKOUT_LIMITS = {
  effort: { step: 5, min: 5, max: 300 },
  recovery: { step: 15, min: 15, max: 600 },
  rounds: { min: 1, max: 30 },
  level: { min: 1, max: 32 },
  warmUp: { step: 60, min: 0, max: 1200 },
  coolDown: { step: 60, min: 0, max: 1200 },
  flatMinutes: { step: 5, min: 5, max: 120 },
  flatCadence: { step: 5, min: 40, max: 120 },
} as const;

interface Limit {
  readonly step: number;
  readonly min: number;
  readonly max: number;
}
const L = CUSTOM_WORKOUT_LIMITS;

/** `value` moved one step up (`+1`) or down (`-1`), held within its bounds. */
function step(value: number, limit: Limit, direction: 1 | -1): number {
  return Math.min(limit.max, Math.max(limit.min, value + direction * limit.step));
}

/** Whether a step that way is open: a control at its bound is disabled. */
export function canStep(value: number, limit: Limit, direction: 1 | -1): boolean {
  return direction > 0 ? value < limit.max : value > limit.min;
}

export function presetOf(id: HiitPresetId): HiitPreset {
  return HIIT_PRESETS.find((preset) => preset.id === id)!;
}

/**
 * A new custom workout: GCN 30-min HIIT, work 24, recover 6, 5:00 and 6:00, flat 12 for 30 min at 85 rpm (L2-094 AC3),
 * and the video off with GCN Training's video in its link.
 */
export function newCustomWorkout(): CustomWorkoutDraft {
  return {
    mode: 'hiit',
    preset: 'gcn30',
    edited: false,
    rounds: presetOf('gcn30').rounds,
    workLevel: 24,
    recoverLevel: 6,
    warmUp: 300,
    coolDown: 360,
    flat: { level: 12, minutes: 30, cadence: 85 },
    video: { on: false, link: DEFAULT_VIDEO_LINK, offset: 0 },
  };
}

export function chooseMode(draft: CustomWorkoutDraft, mode: TrainingMode): CustomWorkoutDraft {
  return { ...draft, mode };
}

/** Loads a plan's rounds; the levels, warm-up and cool-down stay (L2-095 AC1, AC7). */
export function choosePreset(draft: CustomWorkoutDraft, id: HiitPresetId): CustomWorkoutDraft {
  return { ...draft, preset: id, edited: false, rounds: presetOf(id).rounds };
}

function withRounds(draft: CustomWorkoutDraft, rounds: readonly Round[]): CustomWorkoutDraft {
  return { ...draft, rounds, edited: true };
}

/** Round `index`'s effort, ±0:05 within 0:05 to 5:00 (L2-095 AC3). */
export function stepEffort(
  draft: CustomWorkoutDraft,
  index: number,
  direction: 1 | -1,
): CustomWorkoutDraft {
  return withRounds(
    draft,
    draft.rounds.map((round, i) =>
      i === index ? { ...round, effort: step(round.effort, L.effort, direction) } : round,
    ),
  );
}

/** Round `index`'s recovery, ±0:15 within 0:15 to 10:00 (L2-095 AC3). */
export function stepRecovery(
  draft: CustomWorkoutDraft,
  index: number,
  direction: 1 | -1,
): CustomWorkoutDraft {
  return withRounds(
    draft,
    draft.rounds.map((round, i) =>
      i === index ? { ...round, recovery: step(round.recovery, L.recovery, direction) } : round,
    ),
  );
}

/** A copy of the last round, up to 30 rounds (L2-095 AC4). */
export function addRound(draft: CustomWorkoutDraft): CustomWorkoutDraft {
  if (draft.rounds.length >= L.rounds.max) return draft;
  return withRounds(draft, [...draft.rounds, draft.rounds.at(-1)!]);
}

/** Removes round `index`, down to one round (L2-095 AC4). */
export function removeRound(draft: CustomWorkoutDraft, index: number): CustomWorkoutDraft {
  if (draft.rounds.length <= L.rounds.min) return draft;
  return withRounds(
    draft,
    draft.rounds.filter((_, i) => i !== index),
  );
}

/** Every round takes round 1's effort and recovery (L2-095 AC5). */
export function makeRoundsSame(draft: CustomWorkoutDraft): CustomWorkoutDraft {
  const first = draft.rounds[0]!;
  return withRounds(
    draft,
    draft.rounds.map(() => first),
  );
}

/** A level within 1 to 32 (L2-096 AC1, L2-097 AC1). */
export function level(value: number): number {
  return Math.min(L.level.max, Math.max(L.level.min, Math.round(value)));
}

export function setWorkLevel(draft: CustomWorkoutDraft, value: number): CustomWorkoutDraft {
  return { ...draft, workLevel: level(value) };
}

export function setRecoverLevel(draft: CustomWorkoutDraft, value: number): CustomWorkoutDraft {
  return { ...draft, recoverLevel: level(value) };
}

/** Warm-up ±1:00 within 0:00 to 20:00 (L2-096 AC2). */
export function stepWarmUp(draft: CustomWorkoutDraft, direction: 1 | -1): CustomWorkoutDraft {
  return { ...draft, warmUp: step(draft.warmUp, L.warmUp, direction) };
}

/** Cool-down ±1:00 within 0:00 to 20:00 (L2-096 AC2). */
export function stepCoolDown(draft: CustomWorkoutDraft, direction: 1 | -1): CustomWorkoutDraft {
  return { ...draft, coolDown: step(draft.coolDown, L.coolDown, direction) };
}

export function setFlatLevel(draft: CustomWorkoutDraft, value: number): CustomWorkoutDraft {
  return { ...draft, flat: { ...draft.flat, level: level(value) } };
}

/** Duration ±5 min within 5 to 120 min (L2-097 AC2). */
export function stepFlatMinutes(draft: CustomWorkoutDraft, direction: 1 | -1): CustomWorkoutDraft {
  return {
    ...draft,
    flat: { ...draft.flat, minutes: step(draft.flat.minutes, L.flatMinutes, direction) },
  };
}

/** Cadence goal ±5 rpm within 40 to 120 (L2-097 AC2). */
export function stepFlatCadence(draft: CustomWorkoutDraft, direction: 1 | -1): CustomWorkoutDraft {
  return {
    ...draft,
    flat: { ...draft.flat, cadence: step(draft.flat.cadence, L.flatCadence, direction) },
  };
}

/** Turns Ride along to a video on or off (L2-098 AC1). */
export function setVideoOn(draft: CustomWorkoutDraft, on: boolean): CustomWorkoutDraft {
  return { ...draft, video: { ...draft.video, on } };
}

export function setVideoLink(draft: CustomWorkoutDraft, link: string): CustomWorkoutDraft {
  return { ...draft, video: { ...draft.video, link } };
}

/** The offset half a second earlier or later, never below 0 (L2-098 AC3). */
export function stepOffset(draft: CustomWorkoutDraft, direction: 1 | -1): CustomWorkoutDraft {
  return setOffset(draft, draft.video.offset + direction * OFFSET_STEP);
}

/** The offset at `seconds`, to a tenth, as "Use video's current time" or a typed time sets it (L2-098 AC4). */
export function setOffset(draft: CustomWorkoutDraft, seconds: number): CustomWorkoutDraft {
  return { ...draft, video: { ...draft.video, offset: clampOffset(seconds) } };
}

/** The video the ride plays: its id while the switch is on and the link is YouTube's, else `null`. */
export function videoOf(draft: CustomWorkoutDraft): string | null {
  return draft.video.on ? videoIdOf(draft.video.link) : null;
}

/** What "Your ride" reads of the video (L2-099 AC1, AC5): "Synced from 0:12.0", "Off" or "Link needed". */
export function videoFact(draft: CustomWorkoutDraft): string {
  if (!draft.video.on) return 'Off';
  return videoOf(draft) === null
    ? 'Link needed'
    : `Synced from ${formatOffset(draft.video.offset)}`;
}

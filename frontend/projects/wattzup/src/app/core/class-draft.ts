// The class page's rules: the draft a class starts from, its level rows and the plan card's lines
// (L2-080). The catalogue is never written: every change here is to this ride only.
import type { ClassEntry, Segment, StartPlan, WorkoutPlan } from '@wattzup/api';
import { formatDuration } from './format-duration';
import { expandPlan } from './plan-expansion';
import { DEFAULT_INTERVALS, type IntervalsDraft, type StretchDraft } from './intervals-form';
import { DEFAULT_DRAFT, formatClock, type PlanDraft } from './plan-form';
import { DEFAULT_VIDEO_DRAFT, type VideoDraft, videoIdOf } from './video-link';

/** What the class page edits: the plan, the YouTube link and the start point. */
export interface ClassDraft {
  plan: WorkoutPlan;
  url: string;
  start: number;
}

export type LevelRowName = 'Work' | 'Recover' | 'Steady';

export interface LevelRowView {
  name: LevelRowName;
  level: number;
  canLower: boolean;
  canRaise: boolean;
}

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 32;

/** The class as the page first shows it (L2-080 AC2, AC3). */
export function draftOf(entry: ClassEntry): ClassDraft {
  const video = entry.plan.video;
  return {
    plan: entry.plan,
    url: video ? `https://www.youtube.com/watch?v=${video.video_id}` : '',
    start: video?.start_seconds ?? 0,
  };
}

/** Every effort's and every recover's level, or the flat level, per row. */
function levelsOf(plan: WorkoutPlan, name: LevelRowName): number[] {
  switch (plan.kind) {
    case 'flat':
      return name === 'Steady' && plan.level !== null ? [plan.level] : [];
    case 'hiit': {
      const level = name === 'Work' ? plan.work_level : name === 'Recover' ? plan.rest_level : null;
      return level === null ? [] : [level];
    }
    case 'intervals':
      return name === 'Work'
        ? plan.sets.map((s) => s.work_level)
        : name === 'Recover'
          ? plan.sets.map((s) => s.rest_level)
          : [];
  }
}

function rowOf(plan: WorkoutPlan, name: LevelRowName): LevelRowView {
  const levels = levelsOf(plan, name);
  return {
    name,
    level: Math.max(...levels),
    canLower: Math.min(...levels) > MIN_LEVEL,
    canRaise: Math.max(...levels) < MAX_LEVEL,
  };
}

/** `Work` and `Recover` for hiit and intervals, `Steady` for flat (L2-080 AC7, AC8). */
export function levelRows(plan: WorkoutPlan): LevelRowView[] {
  return plan.kind === 'flat'
    ? [rowOf(plan, 'Steady')]
    : [rowOf(plan, 'Work'), rowOf(plan, 'Recover')];
}

const first = (segments: readonly Segment[], kind: Segment['kind']): Segment | undefined =>
  segments.find((s) => s.kind === kind);

/** The plan card's Structure (L2-080 AC6). */
export function structureLine(plan: WorkoutPlan): string {
  switch (plan.kind) {
    case 'flat':
      return `Level ${plan.level} throughout`;
    case 'hiit':
      return `${plan.rounds} × ${formatDuration(plan.work_seconds)} / ${formatDuration(plan.rest_seconds)}`;
    case 'intervals': {
      const efforts = plan.sets.reduce((n, s) => n + s.rounds, 0);
      const work = formatDuration(plan.sets[0]?.work_seconds ?? 0);
      const recovers = plan.sets.map((s) => s.rest_seconds).filter((r) => r > 0);
      if (new Set(recovers).size <= 1) {
        return `${efforts} × ${work} / ${formatDuration(recovers[0] ?? 0)}`;
      }
      return `${efforts} × ${work} · ${formatDuration(recovers[0]!)} → ${formatDuration(recovers.at(-1)!)} recover`;
    }
  }
}

/** The plan card's Cadence: the first work and recover aims, or the steady aim (L2-080 AC6). */
export function cadenceLine(plan: WorkoutPlan): string {
  const segments = expandPlan(plan);
  const steady = first(segments, 'steady');
  if (steady) return `${steady.cadence} rpm`;
  return `${first(segments, 'work')?.cadence} / ${first(segments, 'rest')?.cadence} rpm`;
}

/** `<m:ss> warm-up · <m:ss> cool-down`, each part only when present, or null (L2-080 AC6). */
export function stretchLine(plan: WorkoutPlan): string | null {
  const segments = expandPlan(plan);
  const parts = [
    [first(segments, 'warmup'), 'warm-up'],
    [first(segments, 'cooldown'), 'cool-down'],
  ] as const;
  const line = parts
    .filter(([s]) => s)
    .map(([s, name]) => `${formatDuration(s!.duration)} ${name}`)
    .join(' · ');
  return line || null;
}

const clamp = (level: number, dir: 1 | -1): number =>
  Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level + dir));

/**
 * Moves every effort's, every recover's or the flat level by `dir`, each within 1 to 32; warm-up and
 * cool-down never move. At the limit the plan comes back unchanged (L2-080 AC7, AC8).
 */
export function shiftLevels(plan: WorkoutPlan, row: LevelRowName, dir: 1 | -1): WorkoutPlan {
  const next = shifted(plan, row, dir);
  return JSON.stringify(next) === JSON.stringify(plan) ? plan : next;
}

function shifted(plan: WorkoutPlan, row: LevelRowName, dir: 1 | -1): WorkoutPlan {
  switch (plan.kind) {
    case 'flat':
      return row === 'Steady' && plan.level !== null
        ? { ...plan, level: clamp(plan.level, dir) }
        : plan;
    case 'hiit':
      if (row === 'Work' && plan.work_level !== null) {
        return { ...plan, work_level: clamp(plan.work_level, dir) };
      }
      if (row === 'Recover' && plan.rest_level !== null) {
        return { ...plan, rest_level: clamp(plan.rest_level, dir) };
      }
      return plan;
    case 'intervals':
      if (row === 'Steady') return plan;
      return {
        ...plan,
        sets: plan.sets.map((s) =>
          row === 'Work'
            ? { ...s, work_level: clamp(s.work_level, dir) }
            : { ...s, rest_level: clamp(s.rest_level, dir) },
        ),
      };
  }
}

/** True when the plan, the link or the start point differs from the class's (L2-080 AC9). */
export function isEdited(draft: ClassDraft, entry: ClassEntry): boolean {
  const original = draftOf(entry);
  return (
    draft.url.trim() !== original.url ||
    draft.start !== original.start ||
    JSON.stringify(draft.plan) !== JSON.stringify(original.plan)
  );
}

/** The plan as shown, with `video` `{url, start_seconds}` for a YouTube link, else null (L2-080 AC4, AC10). */
export function toStartRequest(draft: ClassDraft): StartPlan {
  const url = draft.url.trim();
  const video = videoIdOf(url) ? { url, start_seconds: draft.start } : null;
  return { ...draft.plan, video } as StartPlan;
}

/** What `Change intervals in full setup` writes for setup to restore (L2-080 AC12). */
export interface SetupDrafts {
  plan: PlanDraft;
  intervals: IntervalsDraft | null;
  video: VideoDraft;
}

function stretchOf(
  stretch: { seconds: number; level: number; cadence: number } | null,
  fallback: StretchDraft,
): StretchDraft {
  return stretch ? { on: true, ...stretch } : { ...fallback, on: false };
}

/** Setup's drafts in the class's mode, filled from this page's plan and video (L2-080 AC12). */
export function toSetupDrafts(draft: ClassDraft): SetupDrafts {
  const p = draft.plan;
  const url = draft.url.trim();
  const video: VideoDraft = videoIdOf(url)
    ? { on: true, url, start: draft.start }
    : { ...DEFAULT_VIDEO_DRAFT };
  const base: PlanDraft = { ...DEFAULT_DRAFT, mode: p.kind, preset: null };
  switch (p.kind) {
    case 'hiit':
      return {
        plan: {
          ...base,
          rounds: String(p.rounds),
          work: formatClock(p.work_seconds),
          rest: formatClock(p.rest_seconds),
          workLevel: p.work_level ?? DEFAULT_DRAFT.workLevel,
          restLevel: p.rest_level ?? DEFAULT_DRAFT.restLevel,
          warmup: p.warmup,
          cooldown: p.cooldown,
        },
        intervals: null,
        video,
      };
    case 'flat':
      return {
        plan: {
          ...base,
          flatLevel: p.level ?? DEFAULT_DRAFT.flatLevel,
          minutes: `${p.minutes} min`,
          cadence: p.cadence === null ? DEFAULT_DRAFT.cadence : `${p.cadence} rpm`,
        },
        intervals: null,
        video,
      };
    case 'intervals':
      return {
        plan: base,
        intervals: {
          preset: null,
          warmup: stretchOf(p.warmup, DEFAULT_INTERVALS.warmup),
          sets: p.sets.map((s) => ({ ...s })),
          cooldown: stretchOf(p.cooldown, DEFAULT_INTERVALS.cooldown),
        },
        video,
      };
  }
}

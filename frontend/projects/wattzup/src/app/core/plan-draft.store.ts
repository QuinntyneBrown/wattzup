// The last submitted plan draft and the Intervals draft, kept in localStorage (L2-029 AC7, AC16).
import { Injectable } from '@angular/core';
import { DEFAULT_DRAFT, type PlanDraft, PRESETS } from './plan-form';
import {
  DEFAULT_INTERVALS,
  INTERVAL_PRESETS,
  type IntervalsDraft,
  MAX_SETS,
  type SetDraft,
  type StretchDraft,
  setFieldsOf,
  toSetDraft,
  validateIntervals,
} from './intervals-form';
import { SafeStorage } from '@wattzup/api';
import { readVideoDraft, type VideoDraft } from './video-link';

export const PLAN_DRAFT_KEY = 'wattzup.planDraft';
export const INTERVALS_DRAFT_KEY = 'wattzup.intervalsDraft';
/** One video draft for every mode (L2-029 AC20). */
export const VIDEO_DRAFT_KEY = 'wattzup.videoDraft';

const isInt = (v: unknown, min: number, max: number): boolean =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

function isStretch(v: unknown): v is StretchDraft {
  const s = v as Partial<StretchDraft> | null;
  return (
    typeof s === 'object' &&
    s !== null &&
    typeof s.on === 'boolean' &&
    isInt(s.seconds, 60, 1800) &&
    isInt(s.level, 1, 32) &&
    isInt(s.cadence, 40, 150)
  );
}

function isSet(v: unknown): v is SetDraft {
  const s = v as SetDraft | null;
  return (
    typeof s === 'object' &&
    s !== null &&
    isInt(s.work_level, 1, 32) &&
    isInt(s.rest_level, 1, 32) &&
    [s.rounds, s.work_seconds, s.rest_seconds, s.work_cadence, s.rest_cadence].every((n) =>
      Number.isInteger(n),
    ) &&
    toSetDraft(setFieldsOf(s)) !== null
  );
}

/** Accepts a stored Intervals draft only when it is whole and still valid (L2-029 AC16). */
export function readIntervalsDraft(raw: string | null): IntervalsDraft {
  if (!raw) return DEFAULT_INTERVALS;
  try {
    const d = JSON.parse(raw) as Partial<IntervalsDraft> | null;
    const ok =
      typeof d === 'object' &&
      d !== null &&
      (d.preset === null || INTERVAL_PRESETS.some((p) => p.id === d.preset)) &&
      isStretch(d.warmup) &&
      isStretch(d.cooldown) &&
      Array.isArray(d.sets) &&
      d.sets.length >= 1 &&
      d.sets.length <= MAX_SETS &&
      d.sets.every(isSet);
    if (!ok) return DEFAULT_INTERVALS;
    const draft: IntervalsDraft = {
      preset: d.preset ?? null,
      warmup: d.warmup as StretchDraft,
      sets: d.sets as SetDraft[],
      cooldown: d.cooldown as StretchDraft,
    };
    return validateIntervals(draft).length === 0 ? draft : DEFAULT_INTERVALS;
  } catch {
    return DEFAULT_INTERVALS;
  }
}

const STRINGS = ['rounds', 'work', 'rest', 'minutes', 'cadence'] as const;
const LEVELS = ['workLevel', 'restLevel', 'flatLevel'] as const;

/** Accepts stored data only when every field has the right shape. */
export function readDraft(raw: string | null): PlanDraft {
  if (!raw) return DEFAULT_DRAFT;
  try {
    const d = JSON.parse(raw) as Partial<PlanDraft>;
    const ok =
      (d.mode === 'hiit' || d.mode === 'intervals' || d.mode === 'flat') &&
      (d.preset === null || PRESETS.some((p) => p.id === d.preset)) &&
      STRINGS.every((k) => typeof d[k] === 'string') &&
      LEVELS.every(
        (k) => Number.isInteger(d[k]) && (d[k] as number) >= 1 && (d[k] as number) <= 32,
      ) &&
      typeof d.warmup === 'boolean' &&
      typeof d.cooldown === 'boolean';
    return ok ? (d as PlanDraft) : DEFAULT_DRAFT;
  } catch {
    return DEFAULT_DRAFT;
  }
}

@Injectable({ providedIn: 'root' })
export class PlanDraftStore {
  private readonly storage = new SafeStorage(() => localStorage);

  load(): PlanDraft {
    return readDraft(this.storage.get(PLAN_DRAFT_KEY));
  }

  save(draft: PlanDraft): void {
    this.storage.set(PLAN_DRAFT_KEY, JSON.stringify(draft));
  }

  loadIntervals(): IntervalsDraft {
    return readIntervalsDraft(this.storage.get(INTERVALS_DRAFT_KEY));
  }

  saveIntervals(draft: IntervalsDraft): void {
    this.storage.set(INTERVALS_DRAFT_KEY, JSON.stringify(draft));
  }

  loadVideo(): VideoDraft {
    return readVideoDraft(this.storage.get(VIDEO_DRAFT_KEY));
  }

  saveVideo(draft: VideoDraft): void {
    this.storage.set(VIDEO_DRAFT_KEY, JSON.stringify(draft));
  }
}

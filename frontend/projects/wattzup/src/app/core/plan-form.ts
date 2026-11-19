// The plan draft's rules for the setup screen (L2-029, L2-010 messages).
import type { WorkoutPlan } from '@wattzup/api';

export type PresetId = 'tabata' | '40-20' | 'minute-on' | 'long-climbs';

export interface PlanDraft {
  /** `intervals` keeps its own draft (`IntervalsDraft`); this records only that it is chosen. */
  mode: 'hiit' | 'intervals' | 'flat';
  preset: PresetId | null;
  rounds: string;
  work: string;
  rest: string;
  workLevel: number;
  restLevel: number;
  warmup: boolean;
  cooldown: boolean;
  flatLevel: number;
  minutes: string;
  cadence: string;
}

export type DraftField =
  'rounds' | 'work' | 'rest' | 'workLevel' | 'restLevel' | 'flatLevel' | 'minutes' | 'cadence';

export interface DraftError {
  field: DraftField;
  message: string;
  link: string;
}

export interface Preset {
  id: PresetId;
  label: string;
  rounds: number;
  work: number;
  rest: number;
}

export const PRESETS: readonly Preset[] = [
  { id: 'tabata', label: 'Tabata', rounds: 8, work: 20, rest: 10 },
  { id: '40-20', label: '40 / 20', rounds: 8, work: 40, rest: 20 },
  { id: 'minute-on', label: 'Minute on', rounds: 10, work: 60, rest: 60 },
  { id: 'long-climbs', label: 'Long climbs', rounds: 4, work: 240, rest: 120 },
];

export const DEFAULT_DRAFT: PlanDraft = {
  mode: 'hiit',
  preset: null,
  rounds: '18',
  work: '0:40',
  rest: '0:20',
  workLevel: 26,
  restLevel: 18,
  warmup: true,
  cooldown: true,
  flatLevel: 12,
  minutes: '30 min',
  cadence: '85 rpm',
};

/** `0:40` → 40, `45` → 45; anything else → null. */
export function parseClock(text: string): number | null {
  const t = text.trim();
  const m = /^(\d{1,3}):([0-5]\d)$/.exec(t);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return /^\d{1,5}$/.test(t) ? Number(t) : null;
}

export function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Reads the whole number before an optional unit: `30 min` → 30, `85 rpm` → 85. */
export function parseUnit(text: string): number | null {
  const m = /^\s*(\d{1,5})\s*[a-z]*\s*$/i.exec(text);
  return m ? Number(m[1]) : null;
}

export function applyPreset(draft: PlanDraft, id: PresetId): PlanDraft {
  const p = PRESETS.find((x) => x.id === id);
  if (!p) return draft;
  return {
    ...draft,
    preset: id,
    rounds: String(p.rounds),
    work: formatClock(p.work),
    rest: formatClock(p.rest),
  };
}

/** Applies an edit; editing Rounds, Work or Recover clears the pressed preset. */
export function editDraft(draft: PlanDraft, change: Partial<PlanDraft>): PlanDraft {
  const clears = 'rounds' in change || 'work' in change || 'rest' in change;
  return { ...draft, ...change, ...(clears ? { preset: null } : {}) };
}

interface Rule {
  min: number;
  max: number;
  step: number;
  parse: (d: PlanDraft) => number | null;
  format: (n: number) => string | number;
  link: string;
  message: (n: number | null) => string;
}

const level = (link: string, get: (d: PlanDraft) => number): Rule => ({
  min: 1,
  max: 32,
  step: 1,
  parse: (d) => (Number.isInteger(get(d)) ? get(d) : null),
  format: (n) => n,
  link,
  message: () => 'Level must be 1 to 32.',
});

const seconds = (name: 'Work' | 'Recover', get: (d: PlanDraft) => string): Rule => ({
  min: 5,
  max: 3600,
  step: 5,
  parse: (d) => parseClock(get(d)),
  format: formatClock,
  link: '',
  message: (n) =>
    n === null
      ? 'Enter a whole number.'
      : n < 5
        ? `${name} must be at least 0:05.`
        : `${name} must be at most 60:00.`,
});

const RULES: Record<DraftField, Rule> = {
  rounds: {
    min: 1,
    max: 30,
    step: 1,
    parse: (d) => parseUnit(d.rounds),
    format: String,
    link: 'Rounds — enter 1 to 30',
    message: (n) => (n === null ? 'Enter a whole number.' : 'Enter 1 to 30 rounds.'),
  },
  work: seconds('Work', (d) => d.work),
  rest: seconds('Recover', (d) => d.rest),
  workLevel: level('Work resistance — 1 to 32', (d) => d.workLevel),
  restLevel: level('Recover resistance — 1 to 32', (d) => d.restLevel),
  flatLevel: level('Resistance level — 1 to 32', (d) => d.flatLevel),
  minutes: {
    min: 1,
    max: 180,
    step: 5,
    parse: (d) => parseUnit(d.minutes),
    format: (n) => `${n} min`,
    link: 'Duration — 1 to 180 min',
    message: (n) => (n === null ? 'Enter a whole number.' : 'Enter 1 to 180 minutes.'),
  },
  cadence: {
    min: 40,
    max: 150,
    step: 5,
    parse: (d) => parseUnit(d.cadence),
    format: (n) => `${n} rpm`,
    link: 'Cadence goal — 40 to 150 rpm',
    message: (n) => (n === null ? 'Enter a whole number.' : 'Cadence goal must be 40 to 150 rpm.'),
  },
};

const HIIT_FIELDS: DraftField[] = ['rounds', 'work', 'rest', 'workLevel', 'restLevel'];
const FLAT_FIELDS: DraftField[] = ['flatLevel', 'minutes', 'cadence'];

export function fieldsOf(mode: PlanDraft['mode']): DraftField[] {
  return mode === 'hiit' ? HIIT_FIELDS : mode === 'flat' ? FLAT_FIELDS : [];
}

function secondsLink(field: 'work' | 'rest', n: number | null): string {
  const name = field === 'work' ? 'Work' : 'Recover';
  return n !== null && n > 3600 ? `${name} — at most 60:00` : `${name} — at least 0:05`;
}

export function validateDraft(draft: PlanDraft): DraftError[] {
  const errors: DraftError[] = [];
  for (const field of fieldsOf(draft.mode)) {
    const rule = RULES[field];
    const n = rule.parse(draft);
    if (n !== null && n >= rule.min && n <= rule.max) continue;
    const link = field === 'work' || field === 'rest' ? secondsLink(field, n) : rule.link;
    errors.push({ field, message: rule.message(n), link });
  }
  return errors;
}

/** Less (-1) or More (+1): Rounds by 1, Work and Recover by 5 s, Duration by 5 min,
 * Cadence goal by 5 rpm, levels by 1 (L2-029 AC9). */
export function stepDraft(draft: PlanDraft, field: DraftField, dir: 1 | -1): PlanDraft {
  const rule = RULES[field];
  const current = rule.parse(draft) ?? (rule.parse(DEFAULT_DRAFT) as number);
  const next = Math.min(rule.max, Math.max(rule.min, current + dir * rule.step));
  return editDraft(draft, { [field]: rule.format(next) } as Partial<PlanDraft>);
}

/** The HIIT or Flat plan; null while invalid, or for `intervals`, which has its own draft. */
export function toPlan(draft: PlanDraft): WorkoutPlan | null {
  if (draft.mode === 'intervals' || validateDraft(draft).length > 0) return null;
  if (draft.mode === 'flat') {
    return {
      kind: 'flat',
      video: null,
      level: draft.flatLevel,
      minutes: parseUnit(draft.minutes) as number,
      cadence: parseUnit(draft.cadence) as number,
    };
  }
  return {
    kind: 'hiit',
    video: null,
    rounds: parseUnit(draft.rounds) as number,
    work_seconds: parseClock(draft.work) as number,
    rest_seconds: parseClock(draft.rest) as number,
    work_level: draft.workLevel,
    rest_level: draft.restLevel,
    warmup: draft.warmup,
    cooldown: draft.cooldown,
  };
}

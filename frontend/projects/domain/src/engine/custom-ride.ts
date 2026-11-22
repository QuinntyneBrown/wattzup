import type { CustomWorkoutDraft, Plan, Segment } from '@telo/api';

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * The custom ride's workout as its header names it (L2-101 AC1, AC2): HIIT's rounds and their effort ("8 × 0:30", or
 * "8 rounds" when the efforts differ) and the recoveries ridden from first to last ("3:00 → 1:30 recover", or
 * "1:30 recover" when they are all one), none with one round; flat's level and minutes.
 */
export function customWorkoutLabel(draft: CustomWorkoutDraft): string {
  if (draft.mode === 'flat') return `Flat · Level ${draft.flat.level} · ${draft.flat.minutes} min`;
  const { rounds } = draft;
  const effort = rounds[0]!.effort;
  const parts = [
    'HIIT',
    rounds.every((round) => round.effort === effort)
      ? `${rounds.length} × ${clock(effort)}`
      : `${rounds.length} rounds`,
  ];
  // The last round's recovery is not ridden: the cool-down follows it.
  const recoveries = rounds.slice(0, -1).map((round) => round.recovery);
  if (recoveries.length > 0) {
    const first = recoveries[0]!;
    const last = recoveries[recoveries.length - 1]!;
    parts.push(
      recoveries.every((seconds) => seconds === first)
        ? `${clock(first)} recover`
        : `${clock(first)} → ${clock(last)} recover`,
    );
  }
  return parts.join(' · ');
}

/** Where a segment sits among the plan's rounds, and what follows it (L2-102 AC2). */
export interface IntervalPlace {
  /** The round of a work segment or of the recovery after it, and how many there are; `null` outside the rounds. */
  readonly round: { readonly number: number; readonly of: number } | null;
  /** The next segment, or `null` for the last ("Last stretch"). */
  readonly next: Segment | null;
}

/** The round and the next segment of the plan's segment at `index`. */
export function intervalPlace(plan: Plan, index: number): IntervalPlace {
  const { segments } = plan;
  const of = segments.filter((segment) => segment.kind === 'work').length;
  const kind = segments[index]!.kind;
  const number = segments.slice(0, index + 1).filter((segment) => segment.kind === 'work').length;
  return {
    round: kind === 'work' || kind === 'recover' ? { number, of } : null,
    next: segments[index + 1] ?? null,
  };
}

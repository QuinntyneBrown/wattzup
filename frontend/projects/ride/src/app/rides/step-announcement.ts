import type { Segment } from '@telo/api';
import { RIDE_KINDS, formatClock } from '@telo/components';

/** A work or recovery's round, "round 1 of 8". */
export interface StepRound {
  readonly number: number;
  readonly of: number;
}

/**
 * What a screen reader hears as a custom ride's step starts (L2-141 AC2), in the interval card's words: its kind, its
 * round, its length and the level the bike is set to, "Work, round 1 of 8: 0:30 at level 24".
 */
export function customStepAnnouncement(segment: Segment, round: StepRound | null): string {
  const kind = RIDE_KINDS[segment.kind].label;
  const place = round === null ? '' : `, round ${round.number} of ${round.of}`;
  return `${kind}${place}: ${formatClock(segment.duration)} at level ${segment.level}`;
}

/** What a screen reader hears as a class's segment starts (L2-141 AC2), in the segment card's words: "Work, 0:30". */
export function classStepAnnouncement(segment: Segment): string {
  return `${RIDE_KINDS[segment.kind].label}, ${formatClock(segment.duration)}`;
}

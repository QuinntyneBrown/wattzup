import type { Segment } from '@telo/api';
import { PowerModel } from './power-model';

/** Whole seconds as the plan reads them: "0:30", "3:00", "12:00". */
const clock = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * What a plan says in words, for Class Start and the custom ride's preview (L2-084 AC2, L2-099 AC1 to AC3):
 * - its structure: the efforts and their length, then the recoveries from the first to the last ("8 × 0:30 · 3:00 →
 *   1:30 recover"); a plan with no effort reads "Level {n} throughout", or "Steady at level {n}" for its longest segment;
 * - its expected average power: each segment's target power (L2-023 AC3) weighted by its duration, rounded.
 */
export const PlanSummary = {
  structure(segments: readonly Segment[]): string {
    const work = segments.filter((segment) => segment.kind === 'work');
    if (work.length === 0) {
      const levels = new Set(segments.map((segment) => segment.level));
      if (levels.size === 1) return `Level ${segments[0].level} throughout`;
      const longest = segments.reduce((a, b) => (b.duration > a.duration ? b : a));
      return `Steady at level ${longest.level}`;
    }
    const lengths = work.map((segment) => segment.duration);
    const shortest = Math.min(...lengths);
    const longest = Math.max(...lengths);
    const efforts = `${work.length} × ${
      shortest === longest ? clock(shortest) : `${clock(shortest)} to ${clock(longest)}`
    }`;
    const recover = segments.filter((segment) => segment.kind === 'recover');
    if (recover.length === 0) return efforts;
    const first = recover[0].duration;
    const last = recover[recover.length - 1].duration;
    return `${efforts} · ${first === last ? clock(first) : `${clock(first)} → ${clock(last)}`} recover`;
  },

  /**
   * The plan in a sentence, for World loading (L2-151 AC2): the warm-up, the efforts and their recoveries, the
   * cool-down ("5:00 warm-up, 6 × 1:00 efforts with 1:00 recoveries, 4:00 cool-down"); a plan with no effort reads its
   * structure after the warm-up.
   */
  outline(segments: readonly Segment[]): string {
    const first = segments[0];
    const last = segments[segments.length - 1];
    const warmUp = first?.kind === 'warm-up' ? `${clock(first.duration)} warm-up` : null;
    const coolDown =
      last?.kind === 'cool-down' && last !== first ? `${clock(last.duration)} cool-down` : null;
    const [efforts, recover] = PlanSummary.structure(segments).split(' · ');
    const body = segments.some((segment) => segment.kind === 'work')
      ? `${efforts} efforts${recover ? ` with ${recover.replace(' recover', ' recoveries')}` : ''}`
      : warmUp
        ? efforts.charAt(0).toLowerCase() + efforts.slice(1)
        : efforts;
    return [warmUp, body, coolDown].filter((part) => part !== null).join(', ');
  },

  averagePower(segments: readonly Segment[]): number {
    const length = segments.reduce((total, segment) => total + segment.duration, 0);
    if (length === 0) return 0;
    const work = segments.reduce(
      (total, segment) =>
        total + PowerModel.target(segment.cadenceAim, segment.level) * segment.duration,
      0,
    );
    return Math.round(work / length);
  },
} as const;

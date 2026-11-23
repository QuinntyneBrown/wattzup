import type { RaceMode } from '@telo/api';

/** How long a rider coasts without the bike before a bots or riders-online race counts as a DNF, in seconds. */
export const COAST_SECONDS = 15;

/**
 * The rules of a lost bike in a race (docs/detailed-designs/race/pause-leave-or-lose-the-bike-in-a-race, L2-070): the
 * rider's virtual speed decays in a straight line from the speed at the drop to standstill over 15 seconds, after which
 * a bots or riders-online race is a DNF; a solo race parks instead, and neither coasts nor ends.
 */
export const CoastPolicy = {
  /** The coasting speed `seconds` after the drop, from the speed at it. */
  speedMs(fromMs: number, seconds: number): number {
    return fromMs * Math.max(0, 1 - seconds / COAST_SECONDS);
  },
  isDnf(seconds: number): boolean {
    return seconds >= COAST_SECONDS;
  },
  parks(mode: RaceMode): boolean {
    return mode === 'solo';
  },
} as const;

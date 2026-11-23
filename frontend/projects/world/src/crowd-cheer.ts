/** The crowd cheers a rider from this far off, in metres, and is at its loudest within this. */
export const CHEER_FROM = 34;
export const CHEER_FULL = 9;
/** At its loudest a figure hops this many times as high as to the music alone, and stretches up this far (metres). */
export const CHEER_HOP = 3.2;
export const CHEER_REACH = 0.1;

/**
 * How much a figure standing `metres` from the rider cheers them, from 0 (not at all) to 1 (L2-166 AC86): nothing
 * beyond 34 m, rising smoothly as the rider comes, all of it within 9 m, and falling the same way as they go. The
 * figures' material works the same sum out for each corner (dance-material.ts).
 */
export function cheer(metres: number): number {
  const near = Math.min(Math.max((CHEER_FROM - metres) / (CHEER_FROM - CHEER_FULL), 0), 1);
  return near * near * (3 - 2 * near);
}

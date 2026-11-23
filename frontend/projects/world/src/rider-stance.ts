// When a rider stands on the pedals (L2-166 AC29): on a climb steep enough that a rider would. It depends on the
// road alone, so a pack rises together where the ramp begins and sits again over its top.

/** The gradient, in percent, at which a rider begins to leave the saddle, and at which they are fully out of it. */
const BEGINS = 5;
const FULLY = 7;

/** How far out of the saddle a rider is on a road of `gradient` percent: 0 seated, 1 standing, eased between. */
export function outOfTheSaddle(gradient: number): number {
  const t = Math.min(Math.max((gradient - BEGINS) / (FULLY - BEGINS), 0), 1);
  return t * t * (3 - 2 * t);
}

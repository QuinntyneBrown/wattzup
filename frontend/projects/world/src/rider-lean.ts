// How far a rider leans into a bend (L2-166 AC27): the lean that balances a bike round a curve at the pace riders
// hold on a course. The lean depends on the road alone, not on each rider's speed, so a pack leans together and a
// rider who slows does not stand up in the middle of a bend.

/** The pace the lean is worked out for, in metres a second. */
const PACE = 10;
const GRAVITY = 9.81;
/** The furthest a rider leans, in radians: some twenty degrees. */
const MOST = 0.35;

/**
 * The lean, in radians, of a rider whose road points along `heading` here and along `ahead` at `metres` further on:
 * positive when the heading grows. Upright on a straight.
 */
export function bendLean(heading: number, ahead: number, metres: number): number {
  let turn = ahead - heading;
  // The short way round, where the heading wraps.
  turn = Math.atan2(Math.sin(turn), Math.cos(turn));
  const lean = Math.atan((PACE * PACE * turn) / (metres * GRAVITY));
  return Math.min(Math.max(lean, -MOST), MOST);
}

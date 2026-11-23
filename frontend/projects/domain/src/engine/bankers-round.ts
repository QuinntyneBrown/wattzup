/** How close to a half a scaled value must be to count as one, absorbing binary error (0.35 is 0.34999…). */
const HALF_TOLERANCE = 1e-9;

/**
 * Rounds to `digits` decimals, a half to the even neighbour (banker's rounding, L2-022 AC1), shared by the speed and
 * power models: 2.5 → 2, 3.5 → 4, 0.25 → 0.2 at one digit.
 */
export function bankersRound(value: number, digits = 0): number {
  const scale = 10 ** digits;
  const scaled = value * scale;
  const floor = Math.floor(scaled);
  const isHalf = Math.abs(scaled - floor - 0.5) < HALF_TOLERANCE;
  const rounded = isHalf ? (floor % 2 === 0 ? floor : floor + 1) : Math.round(scaled);
  return rounded / scale + 0;
}

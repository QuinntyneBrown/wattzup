/** Degrees a second the scud drifts round the sky: slow enough to be weather, fast enough to be seen to move. */
const DEGREES_A_SECOND = 0.12;

/**
 * How far round the sky the low cloud has drifted at a second of the ride's clock, in radians (L2-166 AC81): steadily
 * one way, on the evening wind, and back where it began every fifty minutes. Nothing before the clock starts.
 */
export function cloudDrift(time: number): number {
  if (time <= 0) return 0;
  return ((time * DEGREES_A_SECOND) % 360) * (Math.PI / 180);
}

// The shape of a rider's shadow in the sun (L2-166 AC35). A shadow on the road is the rider as the sun sees them,
// laid out along the sun's rays: with the sun abeam it is the bike from its side, two wheels and a rider bent over
// them, as wide as the bike is long; with the sun ahead or behind it is the rider end on, as wide as their
// shoulders. This says which, how wide and which way round. No Three.js here.

/** How wide the shadow lies across the sun's rays: the rider end on, and the bike from its side, in metres. */
const END_ON = 0.62;
const SIDE_ON = 1.75;

/** The height a shadow is thrown from: a rider's helmet, in metres. */
const RIDER_TALL = 1.65;
/** The shortest and the longest a shadow is drawn, in metres: a high sun still shows one, a setting sun's is held. */
const SHORTEST = 1.4;
const LONGEST = 6.5;

/**
 * How long a rider's shadow lies on the road, in metres, with the sun `altitude` up (the upward part of the unit
 * vector towards it): the rider's height over the tangent of the sun's angle, so a low sun throws a long one. It is
 * held to `LONGEST`: a sunset's true shadow would cross the whole road.
 */
export function shadowLength(altitude: number): number {
  const up = Math.min(Math.max(altitude, 0), 1);
  const flat = Math.sqrt(1 - up * up);
  if (up * LONGEST <= RIDER_TALL * flat) return LONGEST;
  return Math.max(SHORTEST, (RIDER_TALL * flat) / up);
}

export interface ShadowShape {
  /** Whether the shadow is the bike from its side; otherwise the rider end on. */
  side: boolean;
  /** How wide it lies across the sun's rays, in metres. */
  width: number;
  /** Whether the side-on shape is turned over: the sun is on the bike's left, not its right. */
  flipped: boolean;
}

/**
 * The shadow of a rider whose bike points along `heading` (radians about the vertical; 0 is along -z) with the sun
 * towards (`sunX`, `sunZ`) on the ground, written into `into` when it is given.
 */
export function shadowShape(
  heading: number,
  sunX: number,
  sunZ: number,
  into: ShadowShape = { side: false, width: END_ON, flipped: false },
): ShadowShape {
  const length = Math.hypot(sunX, sunZ) || 1;
  // The bike's own direction on the ground, and how far the sun stands off to its side.
  const forwardX = -Math.sin(heading);
  const forwardZ = -Math.cos(heading);
  const abeam = (forwardX * sunZ - forwardZ * sunX) / length;
  const off = Math.min(Math.abs(abeam), 1);
  into.side = off > Math.SQRT1_2;
  into.width = END_ON + (SIDE_ON - END_ON) * off;
  into.flipped = abeam < 0;
  return into;
}

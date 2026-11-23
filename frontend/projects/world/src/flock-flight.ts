/** Where the flock is, from the eye: metres along x, up and along z from it, how it is turned and how much shows. */
export interface FlockPlace {
  x: number;
  y: number;
  z: number;
  /** Radians its leader's beak (along +x) is turned round the upright. */
  heading: number;
  /** How much of it shows: 0 where it comes into sight and is lost, 1 in between. */
  shown: number;
}

/** Metres towards the sun its path lies, from the eye; and the metres either side of the sun it is flown. */
const OUT = 95;
const FAR = 430;
/** A gull's pace, in metres a second; the height it keeps, and how far it rises and falls about that. */
const SPEED = 13;
const HIGH = 24;
const RISE = 4;
/** The metres at each end of its path over which it comes out of the distance and goes back into it. */
const HAZE = 90;
/** The first flock is this far along its path when the ride starts. */
const LEAD = 60;

/** Seconds from one flock to the next. */
export const FLOCK_EVERY = 85;

/**
 * Where the flock of gulls is at a second of the ride's clock: low over the sea, crossing in front of the sun the
 * other way to the aeroplane, at a gull's pace, rising and falling a little as it goes (L2-166 AC79). Its place is
 * from the eye, as the sky's is. Writes `out` and answers whether there is a flock in the sky.
 */
export function flockFlight(
  time: number,
  sun: readonly [number, number, number],
  out: FlockPlace,
): boolean {
  const flown = ((((time + LEAD / SPEED) % FLOCK_EVERY) + FLOCK_EVERY) % FLOCK_EVERY) * SPEED;
  if (flown > 2 * FAR) return false;
  const flat = Math.hypot(sun[0], sun[2]) || 1;
  const sx = sun[0] / flat;
  const sz = sun[2] / flat;
  // Square to the sun, level, and the other way to the aeroplane: the way it flies.
  const ax = sz;
  const az = -sx;
  const along = flown - FAR;
  out.x = sx * OUT + ax * along;
  out.z = sz * OUT + az * along;
  out.y = HIGH + RISE * Math.sin(flown * 0.025) + 0.3 * Math.sin(flown * 0.13);
  out.heading = Math.atan2(-az, ax);
  out.shown = Math.min(1, flown / HAZE, (2 * FAR - flown) / HAZE);
  return true;
}

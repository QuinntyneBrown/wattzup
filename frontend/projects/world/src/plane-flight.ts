/** Where the aeroplane is, from the eye: metres along x, up and along z from it, and how it is turned. */
export interface PlanePlace {
  x: number;
  y: number;
  z: number;
  /** Radians its nose (along +x) is turned round the upright. */
  heading: number;
  /** Radians its nose is raised. */
  pitch: number;
  /** Radians it is rolled about its length: its wings rock a little in the evening air. */
  roll: number;
  /** How much of it shows through the haze: 0 where it comes into sight and is lost, 1 in between. */
  shown: number;
}

/** Metres towards the sun its path lies, from the eye. */
const OUT = 300;
/** Metres either side of the sun its path is flown: beyond, it is too small and too hazed to see. */
const FAR = 2000;
/** Its pace on the approach, in metres a second. */
const SPEED = 72;
/** Metres up where it comes into sight, and the metres it comes down for each metre flown (some 1.3 degrees). */
const HIGH = 96;
const SINK = 0.022;
/** Its nose is held a little up as it comes in, in radians. */
const NOSE_UP = 0.05;
/** The first is this far along its path when the ride starts, so there is one to see from the line. */
const LEAD = 920;

/** The metres at each end of its path over which it comes out of the haze and goes back into it. */
const HAZE = 600;

/** Seconds from one aeroplane to the next. */
export const PLANE_EVERY = 110;
/** Seconds into the ride at which the first has crossed and is gone. */
export const PLANE_SEEN = (2 * FAR - LEAD) / SPEED;

/**
 * Where the aeroplane is at a second of the ride's clock: an airliner on its way in to land, crossing the sky in
 * front of the sun from one side to the other, coming down as it goes (L2-166 AC45). Its place is from the eye, as
 * the sky's is, so it is seen from anywhere on the map. Writes `out` and answers whether there is one in the sky.
 */
export function planeFlight(
  time: number,
  sun: readonly [number, number, number],
  out: PlanePlace,
): boolean {
  const flown = ((((time + LEAD / SPEED) % PLANE_EVERY) + PLANE_EVERY) % PLANE_EVERY) * SPEED;
  if (flown > 2 * FAR) return false;
  const flat = Math.hypot(sun[0], sun[2]) || 1;
  const sx = sun[0] / flat;
  const sz = sun[2] / flat;
  // Square to the sun, level: the way it flies.
  const ax = -sz;
  const az = sx;
  const along = flown - FAR;
  out.x = sx * OUT + ax * along;
  out.z = sz * OUT + az * along;
  out.y = HIGH - SINK * flown;
  out.heading = Math.atan2(-az, ax);
  out.pitch = NOSE_UP;
  out.roll = 0.02 * Math.sin(time * 0.5) + 0.008 * Math.sin(time * 1.1 + 1);
  out.shown = Math.min(1, flown / HAZE, (2 * FAR - flown) / HAZE);
  return true;
}

/** The sizes an arrival may be, of the size the aeroplane was built: a small jet, the airliner, a wide-body. */
const SIZES = [0.78, 1, 1.3, 0.9, 1.15] as const;

/**
 * How big the aeroplane in the sky is at a second of the ride's clock, of the size it was built (L2-166 AC109): the
 * first to cross is that size, and each that comes after is one of a few, a smaller jet or a bigger one, the same
 * all the way across and the same on every ride. They are all one aeroplane's shape, and seen dark against the
 * sunset that is all that tells them apart.
 */
export function planeSize(time: number): number {
  const arrival = Math.floor((time + LEAD / SPEED) / PLANE_EVERY);
  if (arrival <= 0) return 1;
  // In a skipping order, so that a big one follows a small one: 1.3, 1.15, 0.78, 0.9, 1 and round again.
  return SIZES[(arrival * 2) % SIZES.length]!;
}

/** Seconds from one pair of strobe flashes to the next, and how long a flash and the beacon's blink last. */
const LIGHTS_EVERY = 1.1;
const FLASH = 0.06;
const BLINK = 0.12;

/**
 * Which of the aeroplane's flashing lights are lit at a second of the ride's clock: the white strobes at its wing
 * tips and tail flash twice in quick succession, and the red beacons on its back and belly blink between them
 * (L2-166 AC50). Its red, green and landing lights burn steadily.
 */
export function planeLights(time: number): { strobe: boolean; beacon: boolean } {
  const at = ((time % LIGHTS_EVERY) + LIGHTS_EVERY) % LIGHTS_EVERY;
  return {
    strobe: at < FLASH || (at >= 0.15 && at < 0.15 + FLASH),
    beacon: at >= 0.55 && at < 0.55 + BLINK,
  };
}

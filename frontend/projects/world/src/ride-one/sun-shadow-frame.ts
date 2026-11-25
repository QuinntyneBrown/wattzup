// Where the rider's shadow in the sun lies (L2-174 AC12). The shadow is the rider's own figure as the sun sees it,
// laid on the road along the sun's rays (sun-shadow.ts draws it); this says which way those rays run and how far
// they carry a shadow. A sun near the horizon would throw the rider's shadow off the road and across the island, and
// the renderer's own light stands higher than that to shade the rider at all, so a sun lower than `LOWEST_SUN` is
// counted as standing that high. No Three.js here.

/** The layer the rider's figure is drawn from for their shadow: what throws the shadow is on it, and nothing else. */
export const FIGURE_LAYER = 1;
/** Marks, in a part's `userData`, a part of the rider that throws no shadow: a coarser copy of it throws it instead. */
export const NO_SHADOW = 'shadowNone';

/**
 * Where the course's renderer stands the light that shades the rider: this many metres out along the sun's bearing
 * and this many up, whatever height the course's file gives the sun (Ibiza's is 6°, which would light nothing from
 * above).
 */
export const SUN_LIGHT = { out: 70, up: 34 } as const;
/**
 * The lowest the sun is counted as standing for a shadow, in radians: as high as the light that shades the rider
 * (25.9°), so the shadow is thrown by the light the eye sees on them.
 */
export const LOWEST_SUN = Math.atan2(SUN_LIGHT.up, SUN_LIGHT.out);

/** The sun as a shadow is thrown from it. */
export interface ShadowSun {
  /** A unit vector from the ground towards the sun, in the map's axes (+y up). */
  x: number;
  y: number;
  z: number;
  /** A unit vector along the ground straight away from the sun: the way a shadow lies. */
  awayX: number;
  awayZ: number;
  /** The sun's height above the horizon as the shadow is thrown, in radians. */
  altitude: number;
}

/**
 * The sun a shadow is thrown from, for a course whose file says the light comes from `sun`: its bearing is the
 * file's, its height the file's or `LOWEST_SUN` if that is higher. A sun straight overhead throws its shadow
 * under the rider, lying along -x for want of a bearing.
 */
export function shadowSun(
  sun: readonly [number, number, number],
  into: ShadowSun = { x: 0, y: 1, z: 0, awayX: -1, awayZ: 0, altitude: Math.PI / 2 },
): ShadowSun {
  const [x, y, z] = sun;
  const flat = Math.hypot(x, z);
  const altitude = Math.min(Math.max(Math.atan2(y, flat), LOWEST_SUN), Math.PI / 2);
  const bearingX = flat > 1e-6 ? x / flat : 1;
  const bearingZ = flat > 1e-6 ? z / flat : 0;
  into.x = bearingX * Math.cos(altitude);
  into.y = Math.sin(altitude);
  into.z = bearingZ * Math.cos(altitude);
  into.awayX = -bearingX;
  into.awayZ = -bearingZ;
  into.altitude = altitude;
  return into;
}

/** How far along the ground, in metres, the shadow of a point `height` metres up lies from under it. */
export function shadowReach(height: number, altitude: number): number {
  return height / Math.tan(altitude);
}

/**
 * What is left of the road's light in the rider's shadow, a share for each of red, green and blue. In the shadow the
 * sun's light is gone and the sky's is left, so the shadow is as deep as the sun's share of the light on the ground
 * and takes the sky's colour: under an orange sun it is cool. `sun` and `sky` are their colours, each multiplied by
 * its strength; the sun's falls on the ground at `altitude`. `depth` deepens it: 1 is the light's own arithmetic.
 */
export function shadowShade(
  sun: readonly [number, number, number],
  sky: readonly [number, number, number],
  altitude: number,
  depth = 1,
): [number, number, number] {
  const onGround = Math.sin(altitude);
  return [0, 1, 2].map((i) => {
    const lit = sky[i]! + sun[i]! * onGround;
    return lit > 0 ? (sky[i]! / lit) ** depth : 1;
  }) as [number, number, number];
}

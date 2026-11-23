// The shadows a rider throws under a course's street lamps (L2-166 AC16): one away from each lamp near them, the two
// either side of the road behind and the two ahead. Each is as long as the lamp is low and far, and as dark as that
// lamp's share of the light where the rider is, so the shadows swing round, stretch and fade as the rider passes
// under each lamp. Arithmetic, not a shadow map. No Three.js here.
import type { CourseLamps } from './course';

/** The height of a rider on the bike, in metres: what a lamp's light has to clear. */
export const RIDER_HEIGHT = 1.5;
/** How dark the shadow of a lamp that gave all the light would be, and the longest shadow drawn, in metres. */
const DARKEST = 0.95;
const LONGEST = 9;
/** The light that reaches under a rider from everywhere else: the sky, the walls, the other lamps. */
const AMBIENT = 0.06;

/** One shadow on the road: where its far end lies from the rider, and how dark it is. */
export interface LampShadow {
  /** Metres up the road from the rider to the shadow's far end; negative is back down it. */
  along: number;
  /** Metres to the right of the rider. */
  across: number;
  /** From 0, no shadow, to 1, black. */
  strength: number;
}

/**
 * The four shadows of a rider `metres` from the start line and `lane` metres right of the centre line, written into
 * `into` when it is given.
 */
export function lampShadows(
  lamps: CourseLamps,
  metres: number,
  lane: number,
  into: LampShadow[] = [],
): LampShadow[] {
  const { every, first, across, height } = lamps;
  const behind = first + Math.floor((metres - first) / every) * every;
  const h2 = height * height;
  let light = AMBIENT;
  let count = 0;
  // Two rows of lamps, one on each kerb; counted, not listed, so a frame allocates nothing.
  for (let r = 0; r < 2; r++) {
    const row = behind + r * every;
    for (let k = 0; k < 2; k++) {
      const side = k === 0 ? across : -across;
      const dAlong = metres - row;
      const dAcross = lane - side;
      const d2 = dAlong * dAlong + dAcross * dAcross;
      // The lamp's light on the ground here, as the ground's own material works it out.
      const fall = (h2 / (h2 + d2)) ** 2;
      light += fall;
      // Similar triangles: the shadow runs on from the rider as far as their height carries the lamp's ray.
      const reach = RIDER_HEIGHT / (height - RIDER_HEIGHT);
      const length = Math.sqrt(d2) * reach;
      const trim = length > LONGEST ? LONGEST / length : 1;
      const shadow = (into[count] ??= { along: 0, across: 0, strength: 0 });
      shadow.along = dAlong * reach * trim;
      shadow.across = dAcross * reach * trim;
      // A long shadow is a soft one.
      shadow.strength = fall / (1 + length / 14);
      count++;
    }
  }
  for (let i = 0; i < count; i++) into[i]!.strength *= DARKEST / light;
  into.length = count;
  return into;
}

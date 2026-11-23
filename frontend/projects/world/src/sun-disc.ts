/** How the sun's disc looks at its height: what its painted colours are multiplied by, and how flat it is. */
export interface SunDisc {
  tint: [number, number, number];
  /** Its height over its width: 1 is round. */
  flat: number;
}

/** The height, in degrees, from which the disc is as it was painted; below it the disc reddens and flattens. */
const CLEAR = 6;
/** On the horizon: the air has taken its blue and most of its green, and bent its lower limb up. */
const LOW: SunDisc = { tint: [1, 0.5, 0.3], flat: 0.8 };

/**
 * The sun going down (L2-166 AC92): at `degrees` over the horizon (its middle), the disc is as painted and round
 * from six degrees up, and steadily redder and flatter below, to deep red and a fifth flatter on the horizon.
 * Writes `out` and returns it.
 */
export function sunDisc(degrees: number, out: SunDisc): SunDisc {
  const down = 1 - Math.min(Math.max(degrees / CLEAR, 0), 1);
  for (let part = 0; part < 3; part++) out.tint[part] = 1 + (LOW.tint[part]! - 1) * down;
  out.flat = 1 + (LOW.flat - 1) * down;
  return out;
}

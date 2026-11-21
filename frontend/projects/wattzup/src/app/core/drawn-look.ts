// The drawn look's rules (L2-111 criterion 11, ADR 0024): the three bands its toon shading falls
// into, and its rim light. Pure: the renderer builds its ramp texture and rim term from these.

/** The bands' brightness, darkest first. */
const BANDS = [0.35, 0.7, 1] as const;
/** Where one band gives way to the next, on dot(N, L) mapped to 0..1. */
const EDGES = [0.5, 0.78] as const;
/** Half the width of the soft edge between two bands. */
const SOFT = 0.03;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/** The diffuse shade at `x`: three flat bands with soft edges between them. */
export function toonShade(x: number): number {
  let shade: number = BANDS[0];
  EDGES.forEach((edge, i) => {
    shade += (BANDS[i + 1] - BANDS[i]) * smoothstep(edge - SOFT, edge + SOFT, x);
  });
  return shade;
}

/** `size` texels of toonShade, for the toon material's gradient map. */
export function toonRamp(size: number): Uint8Array {
  return Uint8Array.from({ length: size }, (_, i) => Math.round(toonShade((i + 0.5) / size) * 255));
}

/**
 * The rim light: (1 − N·V)^power × (1 − |N.y|) × strength, in the colour of the scene's sky. It
 * catches silhouettes, not the road and ground, which face up.
 */
export const RIM = { power: 3, strength: 0.35 } as const;

/**
 * The ink outline's thresholds (technique 52). `depth` is the jump in view depth to a neighbour,
 * as a share of the pixel's own depth; `normal` is 1 − N·N' between the two. Each edge is soft
 * over ±`soft`; `strength` is how dark a full edge inks.
 */
export const EDGE = { depth: 0.06, normal: 0.4, soft: 0.02, strength: 0.85 } as const;

/** Ink colours: the scenery's, and a warmer one for the rider and pacers. */
export const INK = { scenery: 0x2a2522, riders: 0x6b2e12 } as const;

/** How much ink a pixel takes, 0 to 1: the larger of its depth and normal edges. */
export function edgeAmount(depthJump: number, normalTurn: number): number {
  return Math.max(
    smoothstep(EDGE.depth - EDGE.soft, EDGE.depth + EDGE.soft, depthJump),
    smoothstep(EDGE.normal - EDGE.soft, EDGE.normal + EDGE.soft, normalTurn),
  );
}

/** Where on the screen (0 at the top) the sky reaches its middle and horizon stops. */
export const SKY_AT = { middle: 0.3, horizon: 0.5 } as const;

export interface SkyStops {
  readonly zenith: number;
  readonly middle: number;
  readonly horizon: number;
}

const mixHex = (a: number, b: number, t: number) =>
  [16, 8, 0].reduce((hex, shift) => {
    const c = Math.round(((a >> shift) & 0xff) * (1 - t) + ((b >> shift) & 0xff) * t);
    return hex | (c << shift);
  }, 0);

/**
 * The scene's flat sky (technique 53): its own sky colour in the middle, deeper overhead and
 * paler at the horizon, where the fog takes its tint.
 */
export function skyStops(sky: number): SkyStops {
  return { zenith: mixHex(sky, 0x000000, 0.2), middle: sky, horizon: mixHex(sky, 0xffffff, 0.35) };
}

/** The sky's colour at screen height `y`, 0 at the top: straight lines between the stops. */
export function skyAt(stops: SkyStops, y: number): number {
  if (y <= SKY_AT.middle) return mixHex(stops.zenith, stops.middle, Math.max(y, 0) / SKY_AT.middle);
  const t = Math.min((y - SKY_AT.middle) / (SKY_AT.horizon - SKY_AT.middle), 1);
  return mixHex(stops.middle, stops.horizon, t);
}

/** A 4 × 4 ordered (Bayer) dither, row by row: each threshold once, neighbours far apart. */
export const BAYER_4: readonly number[] = [
  0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5,
].map((n) => (n + 0.5) / 16);

/** How far the dither moves a material's alpha cut-off, either way in all (technique 54). */
export const DITHER = { spread: 0.4 } as const;

/** The alpha cut-off at a pixel whose dither threshold is `bayer`, kept within 0.02 to 0.98. */
export function ditherThreshold(alphaTest: number, bayer: number): number {
  return Math.min(Math.max(alphaTest + (bayer - 0.5) * DITHER.spread, 0.02), 0.98);
}

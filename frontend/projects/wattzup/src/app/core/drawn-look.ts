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

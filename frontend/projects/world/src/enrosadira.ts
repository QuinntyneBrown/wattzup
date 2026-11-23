// Spectral progression of Enrosadira (alpenglow) on Dolomite calcium-magnesium carbonate walls.

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const STAGES: readonly (readonly [number, Rgb])[] = [
  [0.0, { r: 0.81, g: 0.77, b: 0.71 }], // Daylight pale dolomite
  [0.35, { r: 0.97, g: 0.71, b: 0.51 }], // Apricot-gold onset
  [0.7, { r: 0.95, g: 0.46, b: 0.41 }], // Peak coral-rose Enrosadira
  [1.0, { r: 0.52, g: 0.43, b: 0.62 }], // Post-sunset alpine violet (impallidimento)
];

/** Interpolates the Enrosadira rock tint for evening progression `phase` in [0, 1]. */
export function enrosadiraTint(phase: number): Rgb {
  const t = Math.max(0, Math.min(1, phase));
  for (let i = 0; i < STAGES.length - 1; i++) {
    const [t0, c0] = STAGES[i]!;
    const [t1, c1] = STAGES[i + 1]!;
    if (t <= t1) {
      const u = (t - t0) / (t1 - t0);
      const s = u * u * (3 - 2 * u);
      return {
        r: c0.r + (c1.r - c0.r) * s,
        g: c0.g + (c1.g - c0.g) * s,
        b: c0.b + (c1.b - c0.b) * s,
      };
    }
  }
  return STAGES[STAGES.length - 1]![1];
}

/** Direct Enrosadira illumination factor (0..1) on a horizontal rock normal (nx, ny) for `sunAzimuth` radians. */
export function cliffAspectIllumination(nx: number, ny: number, sunAzimuth: number): number {
  const len = Math.hypot(nx, ny);
  if (len < 1e-6) return 0;
  const dot = (nx / len) * Math.cos(sunAzimuth) + (ny / len) * Math.sin(sunAzimuth);
  const t = Math.max(0, Math.min(1, (dot + 0.15) / 0.9));
  return t * t * (3 - 2 * t);
}

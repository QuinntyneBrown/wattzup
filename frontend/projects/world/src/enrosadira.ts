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

/** Alpenglow intensity weight (0..1) by real Dolomite altitude (valley shadow < 1,900 m, full glow > 2,750 m). */
export function altitudeAlpenglowWeight(altitudeMetres: number): number {
  if (altitudeMetres <= 1900) return 0;
  if (altitudeMetres >= 2750) return 1;
  const u = (altitudeMetres - 1900) / (2750 - 1900);
  return u * u * (3 - 2 * u);
}

/** Anti-solar Belt of Venus intensity (0..1) for view azimuth `viewAz` and elevation `horizonElev` (0..1). */
export function beltOfVenusWeight(viewAz: number, sunAz: number, horizonElev: number): number {
  const anti = Math.max(0, -Math.cos(viewAz - sunAz));
  const band = Math.exp(-(((horizonElev - 0.11) / 0.075) ** 2));
  return Math.pow(anti, 1.6) * band;
}

/** Spectral reflectance RGB weights of pale Hauptdolomit CaMg(CO3)2 rock explaining its vivid rose-orange alpenglow. */
export function dolomiaCarbonateReflectance(): {
  readonly r: number;
  readonly g: number;
  readonly b: number;
} {
  return { r: 0.78, g: 0.69, b: 0.61 };
}

/** Normalized dusk light-pool falloff (0..1) at `distanceMetres` from a rifugio/village light of `reachMetres`. */
export function duskLightPoolFalloff(distanceMetres: number, reachMetres: number): number {
  if (reachMetres <= 0 || distanceMetres >= reachMetres) return 0;
  if (distanceMetres <= 0) return 1;
  const u = 1 - distanceMetres / reachMetres;
  return u * u;
}

// Altitudinal vegetation belts of the Sella Ronda (1,465 m Val di Fassa up to 3,152 m Piz Boè).

export type DolomiteFloraZone =
  'valley-meadow' | 'spruce-larch' | 'krummholz-pasture' | 'dolomite-scree';

/** Classifies a real Dolomite altitude (metres above sea level) into its ecological flora belt. */
export function dolomiteFloraZone(altitudeMetres: number): DolomiteFloraZone {
  if (altitudeMetres < 1700) return 'valley-meadow';
  if (altitudeMetres < 2080) return 'spruce-larch';
  if (altitudeMetres < 2380) return 'krummholz-pasture';
  return 'dolomite-scree';
}

/** Relative conifer canopy density (0..1) across the Dolomite timberline (1,850 m -> 2,220 m). */
export function treeLineDensity(altitudeMetres: number): number {
  if (altitudeMetres <= 1850) return 1;
  if (altitudeMetres >= 2220) return 0;
  const u = (2220 - altitudeMetres) / (2220 - 1850);
  return u * u * (3 - 2 * u);
}

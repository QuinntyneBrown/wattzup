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

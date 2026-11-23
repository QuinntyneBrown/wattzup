// Catalogue of the dominant 3,000 m+ Dolomite peaks visible from each sector of Sella Ronda.

export interface DolomiteGiant {
  readonly id: string;
  readonly name: string;
  readonly altitudeMetres: number;
  readonly hasGlacier: boolean;
  readonly bestViewedAtMetres: number;
}

export const DOLOMITE_GIANTS: readonly DolomiteGiant[] = [
  {
    id: 'sassongher',
    name: 'Sassongher',
    altitudeMetres: 2665,
    hasGlacier: false,
    bestViewedAtMetres: 300,
  },
  {
    id: 'piz-boe',
    name: 'Piz Boè (Sella)',
    altitudeMetres: 3152,
    hasGlacier: false,
    bestViewedAtMetres: 2100,
  },
  {
    id: 'marmolada',
    name: 'Marmolada (Punta Penia)',
    altitudeMetres: 3343,
    hasGlacier: true,
    bestViewedAtMetres: 4950,
  },
  {
    id: 'sassolungo',
    name: 'Sassolungo / Langkofel',
    altitudeMetres: 3181,
    hasGlacier: false,
    bestViewedAtMetres: 7750,
  },
  {
    id: 'grande-cir',
    name: 'Grande Cir',
    altitudeMetres: 2592,
    hasGlacier: false,
    bestViewedAtMetres: 10150,
  },
] as const;

/** Returns the signature Dolomite massif dominating the rider's panorama near `metres`. */
export function dominantPeakAt(metres: number): DolomiteGiant {
  const wrapped = ((metres % 11650) + 11650) % 11650;
  let best = DOLOMITE_GIANTS[0]!;
  let bestDist = Infinity;
  for (const peak of DOLOMITE_GIANTS) {
    const raw = Math.abs(wrapped - peak.bestViewedAtMetres);
    const circular = Math.min(raw, 11650 - raw);
    if (circular < bestDist) {
      bestDist = circular;
      best = peak;
    }
  }
  return best;
}

/** Sightline prominence (0..1) of Marmolada's northern glacier from `metres` along Sella Ronda. */
export function marmoladaGlacierSightline(metres: number): number {
  const w = ((metres % 11650) + 11650) % 11650;
  const dist = Math.min(Math.abs(w - 4950), 11650 - Math.abs(w - 4950));
  if (dist >= 2200) return 0;
  const u = 1 - dist / 2200;
  return u * u * (3 - 2 * u);
}

/** Alias of `DolomiteGiant` representing a catalogued Dolomite summit peak. */
export type DolomitePeak = DolomiteGiant;

/** Returns all surrounding Dolomite ranges whose main summit exceeds 3,000 m, sorted descending by altitude. */
export function peaksAboveThreeThousand(): readonly DolomitePeak[] {
  return [...DOLOMITE_GIANTS]
    .filter((p) => p.altitudeMetres >= 3000)
    .sort((a, b) => b.altitudeMetres - a.altitudeMetres);
}

/** Real-world elevation span (m) of Ghiacciaio della Marmolada on the north face above Lago Fedaia. */
export function marmoladaGlacierElevationBand(): {
  readonly snoutMetres: number;
  readonly crestMetres: number;
} {
  return { snoutMetres: 2680, crestMetres: 3309 };
}

/** Sightline prominence (0..1) of Sassolungo (3,181 m) from `metres` along Sella Ronda. */
export function sassolungoSightline(metres: number): number {
  const w = ((metres % 11650) + 11650) % 11650;
  const dist = Math.min(Math.abs(w - 7750), 11650 - Math.abs(w - 7750));
  if (dist >= 2500) return 0;
  const u = 1 - dist / 2500;
  return u * u * (3 - 2 * u);
}

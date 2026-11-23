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

// Historic Dolomite pass rifugi and mountain hotels along the Sella Ronda loop.

export interface SellaRifugio {
  readonly name: string;
  readonly passId: 'campolongo' | 'pordoi' | 'sella' | 'gardena';
  readonly courseMetres: number;
  readonly altitudeMetres: number;
}

export const SELLA_RIFUGI: readonly SellaRifugio[] = [
  { name: 'Hotel Boè', passId: 'campolongo', courseMetres: 2085, altitudeMetres: 1875 },
  { name: 'Rifugio Monte Cherz', passId: 'campolongo', courseMetres: 2135, altitudeMetres: 1882 },
  { name: 'Hotel Savoia', passId: 'pordoi', courseMetres: 4925, altitudeMetres: 2239 },
  { name: 'Hotel Col di Lana', passId: 'pordoi', courseMetres: 4980, altitudeMetres: 2239 },
  {
    name: 'Passo Sella Dolomiti Mountain Resort',
    passId: 'sella',
    courseMetres: 7725,
    altitudeMetres: 2180,
  },
  { name: 'Rifugio Maria Flora', passId: 'sella', courseMetres: 7785, altitudeMetres: 2240 },
  { name: 'Rifugio Frara', passId: 'gardena', courseMetres: 10130, altitudeMetres: 2121 },
  { name: 'Rifugio Cir', passId: 'gardena', courseMetres: 10185, altitudeMetres: 2121 },
] as const;

/** Returns the closest Sella Ronda pass rifugio to `metres` along the 11,650 m loop. */
export function nearestRifugio(metres: number): SellaRifugio {
  const w = ((metres % 11650) + 11650) % 11650;
  return SELLA_RIFUGI.reduce((best, r) => {
    const dBest = Math.min(
      Math.abs(w - best.courseMetres),
      11650 - Math.abs(w - best.courseMetres),
    );
    const dCur = Math.min(Math.abs(w - r.courseMetres), 11650 - Math.abs(w - r.courseMetres));
    return dCur < dBest ? r : best;
  });
}

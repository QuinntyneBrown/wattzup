// The four Ladin Dolomite valleys and villages linked by the clockwise Sella Ronda loop.

export interface LadinVillage {
  readonly id: 'corvara' | 'arabba' | 'canazei' | 'selva';
  readonly name: string;
  readonly ladinName: string;
  readonly valley: string;
  readonly altitudeMetres: number;
  readonly courseMetres: number;
}

export const LADIN_VILLAGES: readonly LadinVillage[] = [
  {
    id: 'corvara',
    name: 'Corvara',
    ladinName: 'Corvara in Badia',
    valley: 'Val Badia',
    altitudeMetres: 1568,
    courseMetres: 260,
  },
  {
    id: 'arabba',
    name: 'Arabba',
    ladinName: 'Rèba',
    valley: 'Livinallongo / Fodom',
    altitudeMetres: 1602,
    courseMetres: 3120,
  },
  {
    id: 'canazei',
    name: 'Canazei',
    ladinName: 'Cianacei',
    valley: 'Val di Fassa',
    altitudeMetres: 1465,
    courseMetres: 6120,
  },
  {
    id: 'selva',
    name: 'Selva',
    ladinName: 'Sëlva',
    valley: 'Val Gardena',
    altitudeMetres: 1563,
    courseMetres: 8920,
  },
] as const;

/** Names the Ladin valley sector corresponding to `metres` around the clockwise loop. */
export function currentValley(metres: number): LadinVillage {
  const w = ((metres % 11650) + 11650) % 11650;
  if (w >= 2100 && w < 4950) return LADIN_VILLAGES[1]!;
  if (w >= 4950 && w < 7750) return LADIN_VILLAGES[2]!;
  if (w >= 7750 && w < 10150) return LADIN_VILLAGES[3]!;
  return LADIN_VILLAGES[0]!;
}

/** Forward distance in metres along the 11,650 m clockwise loop to the next Ladin village centre. */
export function distanceToNextVillage(metres: number): {
  village: LadinVillage;
  metresAhead: number;
} {
  const w = ((metres % 11650) + 11650) % 11650;
  for (const v of LADIN_VILLAGES) {
    if (v.courseMetres >= w) {
      return { village: v, metresAhead: v.courseMetres - w };
    }
  }
  const first = LADIN_VILLAGES[0]!;
  return { village: first, metresAhead: 11650 - w + first.courseMetres };
}

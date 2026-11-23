// Geographical & visual reference data for Sella Ronda (L2-166, docs/worlds/sellaronda/README.md):
// the four Dolomite passes, four Ladin valleys, and Enrosadira light stages around the central Sella massif.

export interface SellaPass {
  readonly id: 'campolongo' | 'pordoi' | 'sella' | 'gardena';
  readonly name: string;
  readonly ladinName: string;
  readonly altitudeMetres: number;
  readonly courseMetres: number;
}

export const SELLA_RONDA_PASSES: readonly SellaPass[] = [
  {
    id: 'campolongo',
    name: 'Passo Campolongo',
    ladinName: 'Ju de Ćiaulonch',
    altitudeMetres: 1875,
    courseMetres: 2100,
  },
  {
    id: 'pordoi',
    name: 'Passo Pordoi',
    ladinName: 'Jëuf de Pordoi',
    altitudeMetres: 2239,
    courseMetres: 4950,
  },
  {
    id: 'sella',
    name: 'Passo Sella',
    ladinName: 'Jëuf de Sela',
    altitudeMetres: 2240,
    courseMetres: 7750,
  },
  {
    id: 'gardena',
    name: 'Passo Gardena',
    ladinName: 'Ju de Frara',
    altitudeMetres: 2121,
    courseMetres: 10150,
  },
] as const;

/** Returns the next Dolomite pass ahead of `metres` along the clockwise 11,650 m Sella Ronda loop. */
export function nextSellaPass(metres: number): SellaPass {
  const wrapped = ((metres % 11650) + 11650) % 11650;
  return SELLA_RONDA_PASSES.find((p) => p.courseMetres >= wrapped) ?? SELLA_RONDA_PASSES[0]!;
}

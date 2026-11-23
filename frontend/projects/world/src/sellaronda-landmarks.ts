// Geographical & visual reference data for Sella Ronda (L2-166, docs/worlds/sellaronda/README.md):
// the four Dolomite passes, four Ladin valleys, and Enrosadira light stages around the central Sella massif.

export interface SellaPass {
  readonly id: 'campolongo' | 'pordoi' | 'sella' | 'gardena';
  readonly name: string;
  readonly ladinName: string;
  readonly altitudeMetres: number;
  readonly climbFromMetres: number;
  readonly courseMetres: number;
}

export const SELLA_RONDA_PASSES: readonly SellaPass[] = [
  {
    id: 'campolongo',
    name: 'Passo Campolongo',
    ladinName: 'Ju de Ćiaulonch',
    altitudeMetres: 1875,
    climbFromMetres: 850,
    courseMetres: 2100,
  },
  {
    id: 'pordoi',
    name: 'Passo Pordoi',
    ladinName: 'Jëuf de Pordoi',
    altitudeMetres: 2239,
    climbFromMetres: 3300,
    courseMetres: 4950,
  },
  {
    id: 'sella',
    name: 'Passo Sella',
    ladinName: 'Jëuf de Sela',
    altitudeMetres: 2240,
    climbFromMetres: 6250,
    courseMetres: 7750,
  },
  {
    id: 'gardena',
    name: 'Passo Gardena',
    ladinName: 'Ju de Frara',
    altitudeMetres: 2121,
    climbFromMetres: 9000,
    courseMetres: 10150,
  },
] as const;

/** Returns the next Dolomite pass ahead of `metres` along the clockwise 11,650 m Sella Ronda loop. */
export function nextSellaPass(metres: number): SellaPass {
  const wrapped = ((metres % 11650) + 11650) % 11650;
  return SELLA_RONDA_PASSES.find((p) => p.courseMetres >= wrapped) ?? SELLA_RONDA_PASSES[0]!;
}

/**
 * Nominal compass bearing (radians in XY, 0 = East, pi/2 = North) from thecentral Sella massif (Piz Boè)
 * out to the rider at `metres` along the clockwise 11,650 m loop, and which side of the rider the massif stands on.
 */
export function sellaMassifBearing(metres: number): { radialAngle: number; side: 'right' } {
  const u = Math.max(0, Math.min(1, metres / 11650));
  const t = Math.max(0, Math.min(1, (u - 0.012) / (0.972 - 0.012)));
  const smooth = t * t * (3 - 2 * t);
  return { radialAngle: Math.PI / 2 - 5.68 * smooth, side: 'right' };
}

/** If the rider is currently on one of the four pass climbs, returns its progress (0..1) and metres to summit. */
export function passClimbProgress(
  metres: number,
): { pass: SellaPass; fraction: number; remainingMetres: number } | null {
  const active = SELLA_RONDA_PASSES.find(
    (p) => metres >= p.climbFromMetres && metres <= p.courseMetres,
  );
  if (!active) return null;
  const span = active.courseMetres - active.climbFromMetres;
  return {
    pass: active,
    fraction: (metres - active.climbFromMetres) / span,
    remainingMetres: active.courseMetres - metres,
  };
}

export interface SellaSubpeak {
  readonly name: string;
  readonly altitudeMetres: number;
  readonly facingPass: SellaPass['id'];
}

export const SELLA_SUBPEAKS: readonly SellaSubpeak[] = [
  { name: 'Murfrëit', altitudeMetres: 2631, facingPass: 'campolongo' },
  { name: 'Bec de Mezdì', altitudeMetres: 2967, facingPass: 'campolongo' },
  { name: 'Piz Boè', altitudeMetres: 3152, facingPass: 'pordoi' },
  { name: 'Sass Pordoi', altitudeMetres: 2950, facingPass: 'pordoi' },
  { name: 'Torri del Sella (Terza Torre)', altitudeMetres: 2696, facingPass: 'sella' },
  { name: 'Piz Ciavazes', altitudeMetres: 2828, facingPass: 'sella' },
  { name: 'Le Mëisules', altitudeMetres: 2999, facingPass: 'gardena' },
  { name: 'Cima Pisciadù', altitudeMetres: 2985, facingPass: 'gardena' },
] as const;

/** Lists the Sella massif cliffs and towers facing `passId`. */
export function sellaSubpeaksForPass(passId: SellaPass['id']): readonly SellaSubpeak[] {
  return SELLA_SUBPEAKS.filter((p) => p.facingPass === passId);
}

/** Returns the ramp length in metres of `passId` on the Sella Ronda course. */
export function passClimbLengthMetres(passId: SellaPass['id']): number {
  const p = SELLA_RONDA_PASSES.find((entry) => entry.id === passId) ?? SELLA_RONDA_PASSES[0]!;
  return p.courseMetres - p.climbFromMetres;
}

/** True when `metres` lies within 450 m of any of the four high Sella Ronda pass saddles. */
export function isHighWallSector(metres: number): boolean {
  const w = ((metres % 11650) + 11650) % 11650;
  return SELLA_RONDA_PASSES.some((p) => Math.abs(w - p.courseMetres) <= 450);
}

/** Returns the highest of the four Sella Ronda passes (Passo Sella, 2,240 m). */
export function highestSellaPass(): SellaPass {
  return SELLA_RONDA_PASSES.reduce((top, p) => (p.altitudeMetres > top.altitudeMetres ? p : top));
}

const VALLEY_FLOOR_ALTITUDES: Readonly<Record<SellaPass['id'], number>> = {
  campolongo: 1568, // Corvara
  pordoi: 1602, // Arabba
  sella: 1465, // Canazei
  gardena: 1563, // Selva
};

/** Real-world Dolomite vertical ascent (m) from the preceding Ladin valley town to `passId`. */
export function passVerticalGainMetres(passId: SellaPass['id']): number {
  const pass = SELLA_RONDA_PASSES.find((p) => p.id === passId) ?? SELLA_RONDA_PASSES[0]!;
  return pass.altitudeMetres - VALLEY_FLOOR_ALTITUDES[pass.id];
}

const REAL_CLIMB_KM: Readonly<Record<SellaPass['id'], number>> = {
  campolongo: 6.0,
  pordoi: 9.4,
  sella: 11.2,
  gardena: 9.3,
};

/** Real-world average road gradient (%) for the clockwise ascent of `passId`. */
export function passAverageGradientPercent(passId: SellaPass['id']): number {
  return Number(
    ((passVerticalGainMetres(passId) / (REAL_CLIMB_KM[passId] * 1000)) * 100).toFixed(1),
  );
}

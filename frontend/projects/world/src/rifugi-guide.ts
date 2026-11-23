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

/** Lists the pass rifugi standing on `passId` in clockwise riding order. */
export function rifugiOnPass(passId: SellaRifugio['passId']): readonly SellaRifugio[] {
  return SELLA_RIFUGI.filter((r) => r.passId === passId);
}

/** Returns the highest-altitude pass rifugio on the Sella Ronda roadside loop. */
export function highestSellaRifugio(): SellaRifugio {
  return SELLA_RIFUGI.reduce((top, r) => (r.altitudeMetres > top.altitudeMetres ? r : top));
}

/** True when `metres` is within `thresholdMetres` of any Sella Ronda roadside rifugio. */
export function isNearPassRifugio(metres: number, thresholdMetres = 95): boolean {
  const w = ((metres % 11650) + 11650) % 11650;
  return SELLA_RIFUGI.some((r) => {
    const d = Math.min(Math.abs(w - r.courseMetres), 11650 - Math.abs(w - r.courseMetres));
    return d <= thresholdMetres;
  });
}

const PASS_SPECIALTIES: Readonly<Record<SellaRifugio['passId'], string>> = {
  campolongo: 'Turres e Cajinci (Ladin spinach ravioli)',
  pordoi: 'Polenta e Goulash con Funghi Porcini',
  sella: 'Canederli allo Speck in Brodo',
  gardena: 'Kaiserschmarrn con Confettura di Mirtilli Rossi',
};

/** Signature Ladin / Dolomite mountain dish served at rifugi on `passId`. */
export function rifugioSpecialtyDish(passId: SellaRifugio['passId']): string {
  return PASS_SPECIALTIES[passId];
}

/** Counts the catalogued roadside pass rifugi per Sella Ronda pass. */
export function rifugiCountByPass(): Readonly<Record<SellaRifugio['passId'], number>> {
  return {
    campolongo: rifugiOnPass('campolongo').length,
    pordoi: rifugiOnPass('pordoi').length,
    sella: rifugiOnPass('sella').length,
    gardena: rifugiOnPass('gardena').length,
  };
}

/** Returns the next roadside rifugio ahead of `metres` in clockwise loop order and its distance ahead. */
export function nextRifugioAhead(metres: number): {
  readonly rifugio: SellaRifugio;
  readonly metresAhead: number;
} {
  const w = ((metres % 11650) + 11650) % 11650;
  for (const r of SELLA_RIFUGI) {
    if (r.courseMetres >= w) {
      return { rifugio: r, metresAhead: r.courseMetres - w };
    }
  }
  const first = SELLA_RIFUGI[0]!;
  return { rifugio: first, metresAhead: 11650 - w + first.courseMetres };
}

const NEXT_VALLEY_ALTITUDE: Readonly<Record<SellaRifugio['passId'], number>> = {
  campolongo: 1602, // -> Arabba
  pordoi: 1465, // -> Canazei
  sella: 1563, // -> Selva
  gardena: 1568, // -> Corvara
};

/** Vertical descent (m) from `rifugio` down to the next clockwise Ladin valley town. */
export function rifugioElevationDropToNextValley(rifugio: SellaRifugio): number {
  return Math.max(0, rifugio.altitudeMetres - NEXT_VALLEY_ALTITUDE[rifugio.passId]);
}

/** True during typical Dolomite summer rifugio bar & terrace hours (07:00..21:30 local time). */
export function isSummitRifugioOpenAtHour(hour24: number): boolean {
  return hour24 >= 7 && hour24 <= 21.5;
}

/** Lists all Sella Ronda pass rifugi within `radiusMetres` along the loop from `metres`. */
export function rifugiWithinMetres(metres: number, radiusMetres: number): readonly SellaRifugio[] {
  const w = ((metres % 11650) + 11650) % 11650;
  return SELLA_RIFUGI.filter((r) => {
    const d = Math.min(Math.abs(w - r.courseMetres), 11650 - Math.abs(w - r.courseMetres));
    return d <= radiusMetres;
  });
}

/** Mean elevation (m) across all catalogued Sella Ronda pass rifugi. */
export function meanRifugioAltitudeMetres(): number {
  const sum = SELLA_RIFUGI.reduce((acc, r) => acc + r.altitudeMetres, 0);
  return Math.round(sum / Math.max(1, SELLA_RIFUGI.length));
}

/** Finds a Sella Ronda roadside rifugio by case-insensitive partial name match. */
export function findRifugioByName(query: string): SellaRifugio | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const hit = SELLA_RIFUGI.find((r) => r.name.toLowerCase().includes(q));
  return hit ?? null;
}

/** Typical cyclist terrace stop duration in minutes by `stopKind`. */
export function rifugioStopDurationMinutes(
  stopKind: 'bidon-refill' | 'espresso-strudel' | 'ladin-lunch',
): number {
  switch (stopKind) {
    case 'bidon-refill':
      return 3;
    case 'espresso-strudel':
      return 15;
    case 'ladin-lunch':
      return 45;
  }
}

/** Returns all Sella Ronda rifugi sorted by forward clockwise distance ahead of `metres`. */
export function rifugiOrderedAlongRide(metres: number): readonly SellaRifugio[] {
  const w = ((metres % 11650) + 11650) % 11650;
  return [...SELLA_RIFUGI].sort((a, b) => {
    const da = (a.courseMetres - w + 11650) % 11650;
    const db = (b.courseMetres - w + 11650) % 11650;
    return da - db;
  });
}

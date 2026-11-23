// The four Ladin Dolomite valleys and villages linked by the clockwise Sella Ronda loop.

export interface LadinVillage {
  readonly id: 'corvara' | 'arabba' | 'canazei' | 'selva';
  readonly name: string;
  readonly ladinName: string;
  readonly valley: string;
  readonly altitudeMetres: number;
  readonly courseMetres: number;
  readonly churchRoof?: 'onion-dome' | 'gothic-spire';
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

/** Returns the Ladin village whose centre lies within `radiusMetres` of `metres`, or null on open mountain roads. */
export function villageAtMetres(metres: number, radiusMetres = 220): LadinVillage | null {
  const w = ((metres % 11650) + 11650) % 11650;
  for (const v of LADIN_VILLAGES) {
    const dist = Math.min(Math.abs(w - v.courseMetres), 11650 - Math.abs(w - v.courseMetres));
    if (dist <= radiusMetres) return v;
  }
  return null;
}

/** True when `villageId` features a bulbous Tyrolean Zwiebelturm onion dome (false for Arabba's pointed Gothic spire). */
export function hasOnionDomeBelfry(villageId: LadinVillage['id']): boolean {
  return villageId !== 'arabba';
}

export type DolomiteProvince =
  'Bolzano (Alto Adige / Südtirol)' | 'Belluno (Veneto)' | 'Trento (Trentino)';

/** Returns which of the three provinces surrounding the Sella massif contains `metres`. */
export function provinceForMetres(metres: number): DolomiteProvince {
  const w = ((metres % 11650) + 11650) % 11650;
  if (w >= 2108 && w < 4958) return 'Belluno (Veneto)';
  if (w >= 4958 && w < 7758) return 'Trento (Trentino)';
  return 'Bolzano (Alto Adige / Südtirol)';
}

/** Returns the lowest-altitude valley town on the Sella Ronda circuit (Canazei, 1,465 m). */
export function lowestLadinVillage(): LadinVillage {
  return LADIN_VILLAGES.reduce((low, v) => (v.altitudeMetres < low.altitudeMetres ? v : low));
}

const DIALECT_GREETINGS: Readonly<Record<LadinVillage['id'], string>> = {
  corvara: 'Bëgnodüs a Corvara',
  arabba: 'Benvegnù a Rèba',
  canazei: 'Benvegnui a Cianacei',
  selva: 'Bënuni te Sëlva',
};

/** Traditional Ladin valley-dialect welcome greeting for `villageId`. */
export function ladinGreetingForVillage(villageId: LadinVillage['id']): string {
  return DIALECT_GREETINGS[villageId];
}

const VILLAGE_STREAMS: Readonly<Record<LadinVillage['id'], string>> = {
  corvara: 'Rü Tort / Gadera',
  arabba: 'Torrente Cordevole',
  canazei: 'Torrente Avisio',
  selva: 'Rio Gardena / Derjon',
};

/** Names the Dolomite glacial torrent crossed in `villageId`. */
export function streamForVillage(villageId: LadinVillage['id']): string {
  return VILLAGE_STREAMS[villageId];
}

const DEPARTING_PASS: Readonly<
  Record<LadinVillage['id'], 'campolongo' | 'pordoi' | 'sella' | 'gardena'>
> = {
  corvara: 'campolongo',
  arabba: 'pordoi',
  canazei: 'sella',
  selva: 'gardena',
};

/** Returns the clockwise Sella Ronda pass climb departing directly out of `villageId`. */
export function nextClimbFromVillage(
  villageId: LadinVillage['id'],
): 'campolongo' | 'pordoi' | 'sella' | 'gardena' {
  return DEPARTING_PASS[villageId];
}

/** Elevation difference (m) between the highest and lowest main Ladin valley towns on Sella Ronda. */
export function villageAltitudeSpreadMetres(): number {
  const alts = LADIN_VILLAGES.map((v) => v.altitudeMetres);
  return Math.max(...alts) - Math.min(...alts);
}

const GERMAN_ALIASES: Readonly<Record<string, LadinVillage['id']>> = {
  kurfar: 'corvara',
  buchenstein: 'arabba',
  kanetschei: 'canazei',
  wolkenstein: 'selva',
};

/** Finds a Sella Ronda valley town by Italian, Ladin, or historic Tyrolean/German name. */
export function findLadinVillage(query: string): LadinVillage | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const aliasId = GERMAN_ALIASES[q];
  if (aliasId) return LADIN_VILLAGES.find((v) => v.id === aliasId) ?? null;
  const hit = LADIN_VILLAGES.find(
    (v) => v.id === q || v.name.toLowerCase().includes(q) || v.ladinName.toLowerCase().includes(q),
  );
  return hit ?? null;
}

const ARRIVING_FROM_PASS: Readonly<
  Record<LadinVillage['id'], 'campolongo' | 'pordoi' | 'sella' | 'gardena'>
> = {
  arabba: 'campolongo',
  canazei: 'pordoi',
  selva: 'sella',
  corvara: 'gardena',
};

/** Returns the clockwise Dolomite pass descent that leads into `villageId`. */
export function precedingPassForVillage(
  villageId: LadinVillage['id'],
): 'campolongo' | 'pordoi' | 'sella' | 'gardena' {
  return ARRIVING_FROM_PASS[villageId];
}

/** Returns all four Ladin villages ordered forward along the clockwise loop starting from `metres`. */
export function villagesAheadInOrder(metres: number): readonly LadinVillage[] {
  const w = ((metres % 11650) + 11650) % 11650;
  const idx = LADIN_VILLAGES.findIndex((v) => v.courseMetres >= w);
  if (idx <= 0) return [...LADIN_VILLAGES];
  return [...LADIN_VILLAGES.slice(idx), ...LADIN_VILLAGES.slice(0, idx)];
}

export type LadinDialect = 'badiot' | 'fodom' | 'fascian' | 'gherdeina';

/** Specific Dolomite Ladin language variety spoken in `villageId`. */
export function ladinDialectForVillage(villageId: LadinVillage['id']): LadinDialect {
  switch (villageId) {
    case 'corvara':
      return 'badiot';
    case 'arabba':
      return 'fodom';
    case 'canazei':
      return 'fascian';
    case 'selva':
      return 'gherdeina';
  }
}

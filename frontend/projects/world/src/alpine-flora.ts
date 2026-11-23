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

export type DolomiteFauna =
  'simmental-cattle' | 'haflinger-horses' | 'bergschaf-sheep' | 'rupicapra-chamois';

/** Characteristic grazing or wild herbivore encountered at `altitudeMetres` in the Sella Ronda Dolomites. */
export function characteristicFaunaAtAltitude(altitudeMetres: number): DolomiteFauna {
  if (altitudeMetres < 1720) return 'haflinger-horses';
  if (altitudeMetres < 2080) return 'simmental-cattle';
  if (altitudeMetres < 2320) return 'bergschaf-sheep';
  return 'rupicapra-chamois';
}

/** True when `dayOfYear` falls within the June-July Dolomite Alpenrose (Rhododendron) flowering window. */
export function isAlpenroseInBloom(dayOfYear: number): boolean {
  return dayOfYear >= 160 && dayOfYear <= 212;
}

/** Relative density (0..1) of traditional wooden Tabià hay barns at `altitudeMetres`. */
export function tabiaBarnDensityWeight(altitudeMetres: number): number {
  if (altitudeMetres < 1520 || altitudeMetres > 2220) return 0;
  return Math.exp(-(((altitudeMetres - 1860) / 190) ** 2));
}

/** Approximate snow-free alpine growing season in days per year at `altitudeMetres`. */
export function growingSeasonDays(altitudeMetres: number): number {
  const days = 185 - Math.max(0, altitudeMetres - 1400) * 0.095;
  return Math.max(30, Math.round(days));
}

export type DolomiteConifer =
  | 'picea-abies-spruce'
  | 'larix-decidua-larch'
  | 'pinus-cembra-arolla'
  | 'pinus-mugo-dwarf'
  | 'none';

/** Dominant Dolomite conifer species at `altitudeMetres`. */
export function dominantConiferSpecies(altitudeMetres: number): DolomiteConifer {
  if (altitudeMetres < 1780) return 'picea-abies-spruce';
  if (altitudeMetres < 2020) return 'larix-decidua-larch';
  if (altitudeMetres < 2190) return 'pinus-cembra-arolla';
  if (altitudeMetres < 2450) return 'pinus-mugo-dwarf';
  return 'none';
}

/** Probability (0..1) that open pasture at `altitudeMetres` is free of snowpack in `month1To12`. */
export function pastureSnowFreeProbability(altitudeMetres: number, month1To12: number): number {
  const summerCore = Math.max(0, 1 - Math.abs(month1To12 - 7.5) / 3.2);
  const altPenalty = Math.max(0, (altitudeMetres - 1800) / 1400);
  return Number(Math.max(0, Math.min(1, summerCore - altPenalty * 0.45)).toFixed(2));
}

/** Relative alpine wildflower bloom density (0..1), peaking in sunny 1,750..2,100 m hay pastures. */
export function wildflowerBloomIntensity(altitudeMetres: number): number {
  if (altitudeMetres <= 1350 || altitudeMetres >= 2550) return 0;
  const dist = Math.abs(altitudeMetres - 1925);
  return Math.max(0, 1 - (dist / 625) ** 2);
}

/** Traditional Dolomite hay-cutting month (`'june' | 'july' | 'august'`) for `altitudeMetres`. */
export function hayHarvestMonth(altitudeMetres: number): 'june' | 'july' | 'august' {
  if (altitudeMetres < 1650) return 'june';
  if (altitudeMetres < 1950) return 'july';
  return 'august';
}

/** Relative dwarf mountain pine (Pinus mugo) krummholz cover (0..1), peaking between 2,050 m and 2,350 m. */
export function mugoPineCoverWeight(altitudeMetres: number): number {
  if (altitudeMetres <= 1850 || altitudeMetres >= 2550) return 0;
  return Math.exp(-(((altitudeMetres - 2200) / 180) ** 2));
}

/** Habitat suitability (0..1) for alpine Edelweiss on rocky Dolomite limestone at `altitudeMetres`. */
export function edelweissHabitatScore(altitudeMetres: number): number {
  if (altitudeMetres < 1950 || altitudeMetres > 2950) return 0;
  return Math.exp(-(((altitudeMetres - 2420) / 260) ** 2));
}

/** Golden needle coloration (0..1) of European larch (Larix decidua) by `dayOfYear` (1..365) and `altitudeMetres`. */
export function larchAutumnGoldRatio(dayOfYear: number, altitudeMetres: number): number {
  const onsetDay = 285 - Math.max(0, altitudeMetres - 1500) * 0.025;
  const u = Math.max(0, Math.min(1, (dayOfYear - onsetDay) / 22));
  return u * u * (3 - 2 * u);
}

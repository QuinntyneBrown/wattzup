// A map whose world is built as a course (ADR 0034): Ibiza Sunset Strip as the catalogue serves it
// (backend/src/Telo.Ride.Infrastructure/Catalogue/maps.json), with the plan of the class it is modelled after, GCN's
// Intervals to the Beat. A spec serves it through `startRace`'s `catalogue`.
const seg = (kind: string, duration: number, level: number, cadenceAim: number) => ({
  kind,
  duration,
  level,
  cadenceAim,
});
const rounds = (
  count: number,
  work: readonly [number, number, number],
  rest: readonly [number, number],
) =>
  Array.from({ length: count }, () => [
    seg('work', ...work),
    seg('recover', rest[0], rest[1], 90),
  ]).flat();

export const ibizaPlan = [
  seg('warm-up', 150, 14, 80),
  ...rounds(1, [45, 19, 70], [30, 14]),
  ...rounds(1, [75, 21, 80], [60, 13]),
  ...rounds(3, [30, 21, 74], [30, 13]),
  ...rounds(3, [30, 22, 65], [30, 11]),
  seg('work', 15, 24, 70),
  ...rounds(1, [30, 21, 90], [30, 11]),
  seg('work', 15, 24, 70),
  ...rounds(1, [30, 21, 90], [30, 11]),
  ...rounds(4, [20, 22, 110], [20, 11]),
  seg('work', 20, 22, 110),
  seg('cool-down', 150, 11, 81),
];

export const ibizaCourseMap = {
  id: 'ibiza-sunset-strip',
  name: 'Ibiza Sunset Strip',
  routeName: 'Intervals to the Beat',
  place: 'The waterfront strip of Sant Antoni at sunset',
  distanceKm: 8.4,
  climbingM: 159,
  rating: 'Moderate',
  world: 'ibiza',
  thumbnailUrl: 'maps/ibiza-sunset-strip.jpg',
  photoUrl: 'maps/ibiza-sunset-strip-photo.jpg',
  unlockGoal: null,
  unlockMapId: null,
  plan: { segments: ibizaPlan },
  terrain: {
    grade: { 'warm-up': -2, work: 5.5, recover: -3.5, 'cool-down': -5, steady: 0 },
    roll: 0,
  },
};

export const sellaRondaPlan = [
  seg('warm-up', 180, 13, 80),
  seg('work', 120, 18, 90),
  ...Array.from({ length: 7 }, () => [
    seg('work', 30, 22, 100),
    seg('recover', 140, 18, 80),
  ]).flat(),
  seg('cool-down', 190, 11, 80),
];

export const sellaRondaCourseMap = {
  id: 'sella-ronda',
  name: 'Sella Ronda',
  routeName: 'Over/Under Intervals on the Passo Sella',
  place: 'Four Dolomite passes circling the Sella massif',
  distanceKm: 11.7,
  climbingM: 357,
  rating: 'Hard',
  world: 'sellaronda',
  thumbnailUrl: 'maps/sella-ronda.jpg',
  photoUrl: 'maps/sella-ronda-photo.jpg',
  unlockGoal: null,
  unlockMapId: null,
  plan: { segments: sellaRondaPlan },
  terrain: {
    grade: { 'warm-up': 3, work: 7, recover: 4, 'cool-down': 2, steady: 5 },
    roll: 0.6,
  },
};

/** Cinque Terre as the catalogue serves it, with the plan of the class it is modelled after, GCN's 3 Mins On, 2 Mins Off. */
export const cinqueTerrePlan = [
  seg('warm-up', 60, 11, 80),
  seg('work', 60, 14, 80),
  seg('recover', 60, 18, 85),
  seg('work', 30, 21, 90),
  seg('work', 30, 22, 95),
  ...Array.from({ length: 7 }, () => [
    seg('recover', 120, 11, 80),
    seg('work', 180, 22, 90),
  ]).flat(),
  seg('cool-down', 60, 11, 70),
];

export const cinqueTerreCourseMap = {
  id: 'cinqueterre',
  name: 'Cinque Terre',
  routeName: '3 Mins On, 2 Mins Off',
  place: 'The corniche above the Ligurian Sea',
  distanceKm: 17.1,
  climbingM: 335,
  rating: 'Hard',
  world: 'cinqueterre',
  thumbnailUrl: 'maps/cinqueterre.jpg',
  photoUrl: 'maps/cinqueterre-photo.jpg',
  unlockGoal: null,
  unlockMapId: null,
  plan: { segments: cinqueTerrePlan },
  terrain: {
    grade: { 'warm-up': -5, work: 3.5, recover: -5, 'cool-down': -5, steady: 0 },
    roll: 0,
  },
};

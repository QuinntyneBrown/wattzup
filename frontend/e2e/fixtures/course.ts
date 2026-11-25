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

/** Haleakalā as the catalogue serves it, with the plan of the class it is modelled after, GCN's Maximum Intensity Hill Climb Efforts. */
export const haleakalaPlan = [
  seg('warm-up', 180, 13, 90),
  seg('work', 120, 16, 90),
  seg('work', 120, 19, 90),
  seg('work', 60, 24, 90),
  ...Array.from({ length: 2 }, () => [
    seg('recover', 300, 16, 90),
    seg('work', 240, 19, 90),
    seg('work', 180, 24, 90),
  ]).flat(),
  seg('cool-down', 180, 13, 90),
];

export const haleakalaCourseMap = {
  id: 'haleakala',
  name: 'Haleakalā',
  routeName: 'Maximum Intensity Hill Climb Efforts',
  place: 'The summit road from the Pacific coast to the crater rim',
  distanceKm: 15.8,
  climbingM: 923,
  rating: 'Brutal',
  world: 'haleakala',
  thumbnailUrl: 'maps/haleakala.jpg',
  photoUrl: 'maps/haleakala-photo.jpg',
  unlockGoal: null,
  unlockMapId: null,
  plan: { segments: haleakalaPlan },
  terrain: {
    grade: { 'warm-up': 2, work: 8, recover: 4.5, 'cool-down': 2, steady: 6 },
    roll: 0,
  },
};

/** Adelaide Hills rides GCN’s HIIT Fat Burn With Mitchelton-Scott. */
export const adelaideCourseMap = {
  id: 'adelaide-hills',
  name: 'Adelaide Hills',
  routeName: 'The Willunga road',
  place: 'Summer vineyards and gum trees on the climb to Willunga Hill',
  distanceKm: 17.11,
  climbingM: 265,
  rating: 'Moderate',
  world: 'adelaide',
  thumbnailUrl: 'maps/adelaide-hills.jpg',
  photoUrl: 'maps/adelaide-hills-photo.jpg',
  plan: {
    segments: [
      seg('warm-up', 270, 14, 80),
      seg('work', 240, 18, 85),
      seg('recover', 30, 13, 80),
      seg('work', 30, 24, 100),
      seg('recover', 120, 16, 90),
      seg('work', 30, 24, 100),
      seg('recover', 120, 16, 90),
      seg('work', 30, 24, 100),
      seg('recover', 120, 16, 90),
      seg('work', 30, 24, 100),
      seg('work', 120, 16, 90),
      seg('recover', 120, 11, 80),
      seg('work', 270, 21, 90),
      seg('work', 30, 24, 100),
      seg('cool-down', 240, 11, 80),
    ],
  },
  terrain: {
    grade: {
      'warm-up': 1,
      work: 5,
      recover: -1,
      'cool-down': -1,
      steady: 2,
    },
    roll: 1,
  },
  unlockGoal: null,
  unlockMapId: null,
};

/** The pursuit course and the recorded Olympic Pursuit Efforts stages. */
export const aguascalientesCourseMap = {
  id: 'aguascalientes',
  name: 'Aguascalientes Velodrome',
  routeName: 'The pursuit line',
  place: 'A banked timber pursuit track in a high-altitude Mexican arena',
  distanceKm: 12.875,
  climbingM: 0,
  rating: 'Hard',
  world: 'aguascalientes',
  thumbnailUrl: 'maps/aguascalientes.jpg',
  photoUrl: 'maps/aguascalientes-photo.jpg',
  plan: {
    segments: [
      seg('warm-up', 240, 12, 80),
      seg('work', 120, 18, 85),
      seg('recover', 120, 14, 80),
      seg('work', 300, 16, 85),
      seg('work', 240, 18, 85),
      seg('work', 180, 19, 90),
      seg('work', 60, 21, 90),
      seg('recover', 180, 10, 80),
      seg('work', 240, 24, 100),
      seg('cool-down', 120, 11, 80),
    ],
  },
  terrain: {
    grade: {
      'warm-up': 0,
      work: 0,
      recover: 0,
      'cool-down': 0,
      steady: 0,
    },
    roll: 0,
  },
  unlockGoal: null,
  unlockMapId: null,
};

export const algarveCourseMap = {
  ...ibizaCourseMap,
  id: 'algarve-cliffs',
  name: 'Algarve Cliffs',
  routeName: 'The clifftop road',
  place: 'The limestone headlands of southern Portugal',
  world: 'algarve',
  terrain: {
    grade: { 'warm-up': 0.5, work: 2, recover: -0.5, 'cool-down': 0, steady: 1 },
    roll: 1.2,
  },
  distanceKm: 16.8,
  climbingM: 113,
  photoUrl: 'maps/algarve-cliffs-photo.jpg',
  thumbnailUrl: 'maps/algarve-cliffs.jpg',
  plan: {
    segments: [
      seg('warm-up', 120, 11, 80),
      seg('work', 120, 16, 85),
      seg('recover', 180, 12, 80),
      seg('work', 60, 14, 80),
      seg('recover', 60, 16, 85),
      seg('work', 60, 18, 85),
      seg('recover', 60, 19, 90),
      seg('work', 60, 21, 90),
      seg('recover', 120, 10, 80),
      seg('work', 30, 14, 80),
      seg('recover', 60, 18, 85),
      seg('work', 90, 21, 90),
      seg('recover', 120, 10, 80),
      seg('work', 120, 14, 80),
      seg('recover', 180, 21, 90),
      seg('work', 120, 10, 80),
      seg('recover', 120, 14, 80),
      seg('work', 240, 21, 90),
      seg('recover', 60, 23, 100),
      seg('work', 180, 10, 80),
      seg('recover', 60, 21, 90),
      seg('cool-down', 180, 13, 80),
    ],
  },
};

export const alpeCourseMap = {
  ...ibizaCourseMap,
  id: 'alpe-dhuez',
  name: "Alpe d'Huez",
  routeName: 'The 21 hairpins',
  place: 'The 21 bends above Bourg-d’Oisans',
  world: 'alpe',
  terrain: { grade: { 'warm-up': 4, work: 9, recover: 7, 'cool-down': 3, steady: 7 }, roll: 1.2 },
  distanceKm: 7.4,
  climbingM: 328,
  photoUrl: 'maps/alpe-dhuez-photo.jpg',
  thumbnailUrl: 'maps/alpe-dhuez.jpg',
  plan: {
    segments: [
      seg('warm-up', 120, 11, 80),
      seg('work', 60, 14, 80),
      seg('recover', 30, 18, 100),
      seg('work', 60, 19, 100),
      seg('recover', 120, 13, 80),
      seg('work', 120, 19, 60),
      seg('work', 60, 21, 60),
      seg('recover', 60, 11, 90),
      seg('work', 120, 19, 60),
      seg('work', 60, 21, 60),
      seg('recover', 60, 11, 90),
      seg('work', 120, 19, 60),
      seg('work', 120, 21, 75),
      seg('cool-down', 90, 11, 80),
    ],
  },
};

export const amsterdamCourseMap = {
  ...ibizaCourseMap,
  id: 'amsterdam-canals',
  name: 'Amsterdam Canals',
  routeName: 'Herengracht',
  place: 'The canal quays of Amsterdam',
  world: 'amsterdam',
  rating: 'Easy',
  terrain: {
    grade: { 'warm-up': 0, work: 0.5, recover: -0.5, 'cool-down': 0, steady: 0 },
    roll: 0.15,
  },
  distanceKm: 8,
  climbingM: 28,
  photoUrl: 'maps/amsterdam-canals-photo.jpg',
  thumbnailUrl: 'maps/amsterdam-canals.jpg',
  plan: {
    segments: [
      seg('warm-up', 240, 12, 80),
      seg('work', 120, 14, 80),
      seg('recover', 120, 16, 80),
      seg('work', 120, 18, 80),
      seg('work', 120, 19, 80),
      seg('recover', 120, 13, 80),
      seg('work', 120, 21, 80),
      seg('recover', 120, 16, 80),
      seg('cool-down', 120, 13, 80),
    ],
  },
};

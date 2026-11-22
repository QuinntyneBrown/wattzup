// A map whose world is built as a course (ADR 0032): Ibiza Sunset Strip as the catalogue serves it
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

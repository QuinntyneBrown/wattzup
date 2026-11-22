/** The 30:00 plan every map rides for now (the mock's HIIT shape, efforts at level 24 and 98 rpm, 418 W). */
const seg = (kind: string, duration: number, level: number, cadenceAim: number) => ({
  kind,
  duration,
  level,
  cadenceAim,
});
export const racePlan = [
  seg('warm-up', 300, 8, 80),
  ...[180, 150, 150, 120, 120, 90, 90].flatMap((rest) => [
    seg('work', 30, 24, 98),
    seg('recover', rest, 6, 72),
  ]),
  seg('work', 30, 24, 98),
  seg('cool-down', 360, 6, 70),
];

const terrain = (
  warmUp: number,
  work: number,
  recover: number,
  coolDown: number,
  steady: number,
  roll: number,
) => ({
  grade: { 'warm-up': warmUp, work, recover, 'cool-down': coolDown, steady },
  roll,
});

/**
 * The map catalogue as `GET /api/maps` answers it (backend/src/Telo.Ride.Infrastructure/Catalogue/maps.json, ADR 0029):
 * the seven maps of L2-045 AC1 in unlock order, each with its photo (L2-047 AC1), and each locked map with its goal
 * and the map it is earned on (L2-040 AC6). Copied here, as e2e reads no
 * file outside `frontend/`.
 */
export const maps = [
  {
    id: 'prairie-paceline',
    name: 'Prairie Paceline',
    routeName: 'Route 9 Wind Farm',
    place: 'Open farmland at golden hour',
    distanceKm: 18.4,
    climbingM: 90,
    rating: 'Easy',
    world: 'prairie',
    thumbnailUrl: 'maps/prairie-paceline.jpg',
    photoUrl: 'maps/prairie-paceline-photo.jpg',
    unlockGoal: null,
    unlockMapId: null,
    plan: { segments: racePlan },
    terrain: terrain(0, 1.5, -0.5, 0, 0.5, 1),
  },
  {
    id: 'old-town-criterium',
    name: 'Old Town Criterium',
    routeName: 'Cathedral Circuit',
    place: 'A cobbled European old town on race day',
    distanceKm: 14.2,
    climbingM: 140,
    rating: 'Easy',
    world: 'oldtown',
    thumbnailUrl: 'maps/old-town-criterium.jpg',
    photoUrl: 'maps/old-town-criterium-photo.jpg',
    realPlace: {
      name: 'Bruges',
      route: 'Steenstraat to the Markt',
      latitude: 51.2078,
      longitude: 3.2236,
    },
    unlockGoal: null,
    unlockMapId: null,
    plan: { segments: racePlan },
    terrain: terrain(0.5, 6, -1.5, 0, 0, 0.5),
  },
  {
    id: 'cliffside-coast',
    name: 'Cliffside Coast',
    routeName: 'Headland Road',
    place: 'A clifftop road above the sea at sunset',
    distanceKm: 32,
    climbingM: 410,
    rating: 'Moderate',
    world: 'coast',
    thumbnailUrl: 'maps/cliffside-coast.jpg',
    photoUrl: 'maps/cliffside-coast-photo.jpg',
    unlockGoal: 'Finish top 3 vs Bots on Prairie Paceline',
    unlockMapId: 'prairie-paceline',
    plan: { segments: racePlan },
    terrain: terrain(0.5, 4.5, -1.5, -0.5, 0.5, 1.6),
  },
  {
    id: 'neon-docklands',
    name: 'Neon Docklands',
    routeName: 'Harbour Bridges Loop',
    place: 'A harbour city after dark',
    distanceKm: 21.6,
    climbingM: 120,
    rating: 'Moderate',
    world: 'docklands',
    thumbnailUrl: 'maps/neon-docklands.jpg',
    photoUrl: 'maps/neon-docklands-photo.jpg',
    unlockGoal: 'Finish top 3 vs Bots on Old Town Criterium',
    unlockMapId: 'old-town-criterium',
    plan: { segments: racePlan },
    terrain: terrain(0.5, 5.5, -2, 0, 0, 0.6),
  },
  {
    id: 'dolomites',
    name: 'Dolomites',
    routeName: 'Val Gardena Valley Road',
    place: 'An alpine valley under pale limestone peaks',
    distanceKm: 38.5,
    climbingM: 860,
    rating: 'Hard',
    world: 'dolomites',
    thumbnailUrl: 'maps/dolomites.jpg',
    photoUrl: 'maps/dolomites-photo.jpg',
    unlockGoal: 'Earn 2★ on Cliffside Coast',
    unlockMapId: 'cliffside-coast',
    plan: { segments: racePlan },
    terrain: terrain(1, 2, 0, -1, 0.8, 2.4),
  },
  {
    id: 'vice-city',
    name: 'Vice City',
    routeName: 'Ocean Drive to the Causeway',
    place: 'A neon beachfront city at a magenta sunset',
    distanceKm: 24,
    climbingM: 60,
    rating: 'Moderate',
    world: 'vicecity',
    thumbnailUrl: 'maps/vice-city.jpg',
    photoUrl: 'maps/vice-city-photo.jpg',
    unlockGoal: 'Reach rider level 10',
    unlockMapId: null,
    unlockLevel: 10,
    plan: { segments: racePlan },
    terrain: terrain(0.5, 4, -1, 0, 0.5, 0.5),
  },
  {
    id: 'col-du-granit',
    name: 'Col du Granit',
    routeName: null,
    place: 'A high mountain pass at first light',
    distanceKm: 16.1,
    climbingM: 1240,
    rating: 'Brutal',
    world: 'granite',
    thumbnailUrl: 'maps/col-du-granit.jpg',
    photoUrl: 'maps/col-du-granit-photo.jpg',
    unlockGoal: 'Earn 3★ on Dolomites',
    unlockMapId: 'dolomites',
    plan: { segments: racePlan },
    terrain: terrain(3, 8, 3.5, -5, 5, 0.8),
  },
];

/**
 * A test-only map whose world `main`'s World Ride scenes still draw: every catalogue map is a course built in
 * Blender (ADR 0033), so World Ride's own specs (its quality tiers, step-down, riders, a hidden tab) race this,
 * served with `catalogue: [worldRideMap]`. Old Town's plan and terrain, on Amsterdam's canals.
 */
export const worldRideMap = {
  ...maps[1]!,
  id: 'canal-criterium',
  name: 'Canal Criterium',
  world: 'amsterdam',
  realPlace: null,
};

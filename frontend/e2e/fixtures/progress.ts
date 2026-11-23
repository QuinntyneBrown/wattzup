import { newRiderProgress } from './api';

/**
 * The mid rider of docs/mocks/pages/map-select/default.html (L2-041 AC2): level 7, Prairie Paceline, Old Town Criterium
 * and Cliffside Coast open with 3, 1 and 1 stars and bests of 31:42, 27:10 and 58:03, Neon Docklands next, and the
 * 4-day streak of docs/mocks/pages/home/default.html (L2-032 AC2), with Profile's 23 rides and 412 km (L2-109 AC1).
 */
export const midRiderProgress = {
  ...newRiderProgress,
  level: 7,
  totalXp: 1840,
  nextLevelXp: 2600,
  streakDays: 4,
  openMapIds: ['prairie-paceline', 'old-town-criterium', 'cliffside-coast'],
  nextUnlockId: 'neon-docklands',
  stars: { 'prairie-paceline': 3, 'old-town-criterium': 1, 'cliffside-coast': 1 },
  bestTimeSeconds: {
    'prairie-paceline': 1902,
    'old-town-criterium': 1630,
    'cliffside-coast': 3483,
  },
  nextRideMapId: 'old-town-criterium',
  rideCount: 23,
  distanceKm: 412,
};

/**
 * The veteran of docs/mocks/pages/map-select/veteran.html (L2-041 AC3): level 18, every map open but Col du Granit, which
 * is next, with the mock's stars and bests, and the 21-day streak of docs/mocks/pages/home/veteran.html.
 */
export const veteranProgress = {
  ...newRiderProgress,
  level: 18,
  totalXp: 9120,
  nextLevelXp: 10400,
  streakDays: 21,
  openMapIds: [
    'prairie-paceline',
    'old-town-criterium',
    'cliffside-coast',
    'neon-docklands',
    'dolomites',
    'vice-city',
  ],
  nextUnlockId: 'col-du-granit',
  stars: {
    'prairie-paceline': 3,
    'old-town-criterium': 3,
    'cliffside-coast': 3,
    'neon-docklands': 2,
    dolomites: 2,
    'vice-city': 1,
  },
  bestTimeSeconds: {
    'prairie-paceline': 1735,
    'old-town-criterium': 1471,
    'cliffside-coast': 3160,
    'neon-docklands': 1992,
    dolomites: 4280,
    'vice-city': 2324,
  },
  nextRideMapId: 'dolomites',
  rideCount: 146,
  distanceKm: 3870,
};

/** A new rider once a top-3 bots race on Old Town Criterium opened Neon Docklands (L2-040 AC2). */
export const docklandsOpenedProgress = {
  ...newRiderProgress,
  openMapIds: ['prairie-paceline', 'old-town-criterium', 'neon-docklands'],
  stars: { 'old-town-criterium': 2 },
  bestTimeSeconds: { 'old-town-criterium': 1598 },
  unseenUnlockId: 'neon-docklands',
};

/**
 * The mid rider of docs/mocks/pages/home/unlocked.html (L2-036): a top-3 race on Old Town Criterium has just opened Neon
 * Docklands, which Home has not announced yet, so the card has moved on to Dolomites, earned with 2★ on Cliffside Coast.
 */
export const docklandsUnseenProgress = {
  ...midRiderProgress,
  openMapIds: [...midRiderProgress.openMapIds, 'neon-docklands'],
  nextUnlockId: 'dolomites',
  stars: { ...midRiderProgress.stars, 'old-town-criterium': 2 },
  nextRideMapId: 'cliffside-coast',
  unseenUnlockId: 'neon-docklands',
};

/**
 * A level-7 rider whose next unlock is Vice City, by reaching level 10 (L2-033 AC4): Cliffside Coast, Dolomites and Neon
 * Docklands open, Neon Docklands last, so Home offers it.
 */
export const levelGoalProgress = {
  ...midRiderProgress,
  openMapIds: [
    'prairie-paceline',
    'old-town-criterium',
    'cliffside-coast',
    'neon-docklands',
    'dolomites',
  ],
  nextUnlockId: 'vice-city',
  stars: { 'cliffside-coast': 3, 'neon-docklands': 1, dolomites: 1 },
  nextRideMapId: 'neon-docklands',
};

/** A rider with every map open (L2-033 AC5): Dolomites holds the fewest stars, one, so Home offers it. */
export const allOpenProgress = {
  ...veteranProgress,
  level: 21,
  openMapIds: [...veteranProgress.openMapIds, 'col-du-granit'],
  nextUnlockId: null,
  stars: { ...veteranProgress.stars, dolomites: 1, 'vice-city': 2, 'col-du-granit': 3 },
  nextRideMapId: 'dolomites',
};

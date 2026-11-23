// Unit test
// Traces to: L2-033 AC2 to AC5
// Description: the Next ride card's words for the map the backend offers: its tag, the next unlock's goal and the map it
// opens with its place, a level goal with the levels still to climb, one more star on the map with the fewest once every
// map is open, and the rider's best on the map in minutes, or none.
import type { MapDto, ProgressDto } from '@telo/api';
import { nextRideView } from './next-ride-view';

const map = (
  id: string,
  name: string,
  unlockGoal: string | null,
  unlockMapId: string | null,
  unlockLevel: number | null = null,
): MapDto =>
  ({
    id,
    name,
    place: `${name}'s place`,
    distanceKm: 14.2,
    rating: 'Easy',
    thumbnailUrl: `maps/${id}.jpg`,
    photoUrl: `maps/${id}-photo.jpg`,
    unlockGoal,
    unlockMapId,
    unlockLevel,
  }) as MapDto;

const maps = [
  map('prairie-paceline', 'Prairie Paceline', null, null),
  map('old-town-criterium', 'Old Town Criterium', null, null),
  map(
    'cliffside-coast',
    'Cliffside Coast',
    'Finish top 3 vs Bots on Prairie Paceline',
    'prairie-paceline',
  ),
  map(
    'neon-docklands',
    'Neon Docklands',
    'Finish top 3 vs Bots on Old Town Criterium',
    'old-town-criterium',
  ),
  map('vice-city', 'Vice City', 'Reach rider level 10', null, 10),
];

const progress = (changes: Partial<ProgressDto>): ProgressDto => ({
  level: 7,
  totalXp: 1840,
  nextLevelXp: 2600,
  streakDays: 4,
  openMapIds: ['prairie-paceline', 'old-town-criterium', 'cliffside-coast'],
  nextUnlockId: 'neon-docklands',
  stars: { 'old-town-criterium': 1 },
  bestTimeSeconds: { 'old-town-criterium': 1630 },
  nextRideMapId: 'old-town-criterium',
  unseenUnlockId: null,
  rideCount: 0,
  distanceKm: 0,
  ...changes,
});

describe('nextRideView', () => {
  it('offers the map the next unlock is earned on, with the map it opens and the best there', () => {
    expect(nextRideView(progress({}), maps)).toEqual({
      mapId: 'old-town-criterium',
      name: 'Old Town Criterium',
      photoUrl: 'maps/old-town-criterium-photo.jpg',
      tag: 'Old Town Criterium · 14.2 km · Easy',
      goal: 'Finish top 3 vs Bots on Old Town Criterium',
      opens: {
        name: 'Neon Docklands',
        place: "Neon Docklands's place",
        thumbnailUrl: 'maps/neon-docklands.jpg',
      },
      best: '27:10',
    });
  });

  it('has no best on a map never finished', () => {
    expect(nextRideView(progress({ bestTimeSeconds: {} }), maps)?.best).toBeNull();
  });

  it('reads a level goal with the levels still to climb', () => {
    const view = nextRideView(
      progress({ nextUnlockId: 'vice-city', nextRideMapId: 'cliffside-coast' }),
      maps,
    );
    expect(view?.goal).toBe('Reach rider level 10 · 3 to go');
    expect(view?.opens?.name).toBe('Vice City');
  });

  it('asks for one more star on the offered map once every map is open, and opens nothing', () => {
    const view = nextRideView(progress({ nextUnlockId: null }), maps);
    expect(view?.goal).toBe('Earn 2★ on Old Town Criterium');
    expect(view?.opens).toBeNull();
  });

  it('asks for the first star on a map never ridden', () => {
    expect(nextRideView(progress({ nextUnlockId: null, stars: {} }), maps)?.goal).toBe(
      'Earn 1★ on Old Town Criterium',
    );
  });

  it('is nothing until the offered map is in the catalogue', () => {
    expect(nextRideView(progress({ nextRideMapId: 'col-du-granit' }), maps)).toBeNull();
  });
});

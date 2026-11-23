// Unit test
// Traces to: L2-034 AC1, AC2, AC4
// Description: the Race door's counts, open maps of all maps and stars earned of three per map, and its tiles, the first
// four maps in unlock order, each open or locked with its stars.
import type { MapDto, MapProgressDto } from '@telo/api';
import { raceDoorView } from './race-door-view';

const map = (id: string, name: string): MapDto =>
  ({ id, name, thumbnailUrl: `maps/${id}.jpg` }) as MapDto;

const maps = [
  map('prairie-paceline', 'Prairie Paceline'),
  map('old-town-criterium', 'Old Town Criterium'),
  map('cliffside-coast', 'Cliffside Coast'),
  map('neon-docklands', 'Neon Docklands'),
  map('dolomites', 'Dolomites'),
];

const progress: MapProgressDto = {
  openMapIds: ['prairie-paceline', 'old-town-criterium', 'cliffside-coast'],
  nextUnlockId: 'neon-docklands',
  stars: { 'prairie-paceline': 3, 'old-town-criterium': 1, 'cliffside-coast': 1 },
  bestTimeSeconds: {},
};

describe('raceDoorView', () => {
  it('counts the open maps and the stars earned of three per map', () => {
    const view = raceDoorView(progress, maps);
    expect([view.openMaps, view.maps, view.stars, view.allStars]).toEqual([3, 5, 5, 15]);
  });

  it('has a tile for each of the first four maps in unlock order, open or locked, with its stars', () => {
    expect(raceDoorView(progress, maps).tiles).toEqual([
      {
        mapId: 'prairie-paceline',
        name: 'Prairie Paceline',
        photoUrl: 'maps/prairie-paceline.jpg',
        stars: 3,
        locked: false,
      },
      {
        mapId: 'old-town-criterium',
        name: 'Old Town Criterium',
        photoUrl: 'maps/old-town-criterium.jpg',
        stars: 1,
        locked: false,
      },
      {
        mapId: 'cliffside-coast',
        name: 'Cliffside Coast',
        photoUrl: 'maps/cliffside-coast.jpg',
        stars: 1,
        locked: false,
      },
      {
        mapId: 'neon-docklands',
        name: 'Neon Docklands',
        photoUrl: 'maps/neon-docklands.jpg',
        stars: 0,
        locked: true,
      },
    ]);
  });
});

// Unit test
// Traces to: L2-036 AC1
// Description: the unlocked banner's words for the map a ride opened: "{map} is open." and "{place}, {distance} km.";
// nothing for a map missing from the catalogue.
import type { MapDto } from '@telo/api';
import { unlockBannerView } from './unlock-banner-view';

const docklands = {
  id: 'neon-docklands',
  name: 'Neon Docklands',
  place: 'A harbour city after dark',
  distanceKm: 21.6,
} as MapDto;

describe('unlockBannerView', () => {
  it('names the map that opened, its place and its length', () => {
    expect(unlockBannerView('neon-docklands', [docklands])).toEqual({
      mapId: 'neon-docklands',
      title: 'Neon Docklands is open.',
      detail: 'A harbour city after dark, 21.6 km.',
    });
  });

  it('is nothing for a map missing from the catalogue', () => {
    expect(unlockBannerView('vice-city', [docklands])).toBeNull();
  });
});

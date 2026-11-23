import { worldForMap } from './map-world';

describe('worldForMap (L2-064)', () => {
  it.each([
    ['oldtown', 'oldtown'],
    ['prairie', 'prairie'],
    ['coast', 'coast'],
    ['docklands', 'docklands'],
    ['dolomites', 'dolomites'],
    ['granite', 'granite'],
    ['vicecity', 'southbeach'],
  ])('draws the %s map world as %s', (world, drawn) => {
    expect(worldForMap(world).id).toBe(drawn);
  });

  it('refuses a world no scene draws', () => {
    expect(() => worldForMap('atlantis')).toThrow('Unknown world atlantis');
  });
});

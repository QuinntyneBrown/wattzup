import { ambienceOf } from './world-ambience';

describe('ambienceOf (L2-129 AC12)', () => {
  it.each([
    ['southbeach', 'coast'],
    ['stelvio', 'alpine'],
    ['timessquare', 'city'],
    ['centralpark', 'park'],
    ['oldtown', null],
  ] as const)('%s declares %s', (world, preset) => {
    expect(ambienceOf(world)).toBe(preset);
  });
});

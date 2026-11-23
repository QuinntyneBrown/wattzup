// Unit test
// Traces to: L2-067 AC2; L2-050 AC4
// Description: the ghost replays the best ride's trace second by second and holds its last distance after it; with no
// best it rides the medium pace.
import { GhostReplay } from './ghost-replay';
import { VirtualSpeedModel } from './virtual-speed-model';

describe('GhostReplay', () => {
  const trace = [0, 6, 13, 21, 30];

  it.each([
    [0, 0],
    [1, 6],
    [3, 21],
    [4, 30],
    [9, 30],
  ])('at second %d of a best ride stands at %d m', (second, metres) => {
    expect(new GhostReplay(trace).advance(second)).toEqual([
      { id: 'ghost', name: 'Your best', jersey: 'ghost', bot: false, metres },
    ]);
  });

  it('rides 190 W steady with no best', () => {
    const ghost = new GhostReplay(null);
    expect(ghost.advance(60)[0]!.metres).toBeCloseTo(60 * VirtualSpeedModel.speedMs(190), 9);
    expect(new GhostReplay([]).advance(10)[0]!.metres).toBeCloseTo(
      10 * VirtualSpeedModel.speedMs(190),
      9,
    );
  });
});

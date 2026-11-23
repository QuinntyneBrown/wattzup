// Unit test
// Traces to: L2-059 AC3
// Description: the virtual speed from power is 20 × ∛(W ÷ 20) km/h, twice main's, with power taken as at least 1 W.
// The service runs the same table of cases (VirtualSpeedModelTests.cs), so the two copies stay equal (L2-123 AC4).
import { VirtualSpeedModel } from './virtual-speed-model';

describe('VirtualSpeedModel', () => {
  it.each([
    [371, 52.94],
    [418, 55.09],
    [160, 40],
    [20, 20],
    [0, 7.368],
    [-5, 7.368],
  ])('%d W rides at %d km/h', (watts, kmh) => {
    expect(VirtualSpeedModel.speedKmh(watts)).toBeCloseTo(kmh, 2);
  });

  it('gives the same speed in metres a second', () => {
    expect(VirtualSpeedModel.speedMs(160)).toBeCloseTo(40 / 3.6, 6);
  });
});

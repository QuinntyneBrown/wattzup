// Unit test
// Traces to: L2-070 AC2, AC4, AC5
// Description: a lost bike's coast decays the speed in a straight line to standstill over 15 seconds, then a bots or
// riders-online race is a DNF; a solo race parks.
import { COAST_SECONDS, CoastPolicy } from './coast-policy';

describe('CoastPolicy', () => {
  it.each([
    [0, 8.9],
    [3, 7.12],
    [7.5, 4.45],
    [15, 0],
    [20, 0],
  ])('%d s after the drop, 8.9 m/s has decayed to %d m/s', (seconds, speed) => {
    expect(CoastPolicy.speedMs(8.9, seconds)).toBeCloseTo(speed, 6);
  });

  it('counts a DNF from 15 seconds without the bike', () => {
    expect(COAST_SECONDS).toBe(15);
    expect(CoastPolicy.isDnf(14)).toBe(false);
    expect(CoastPolicy.isDnf(15)).toBe(true);
  });

  it.each([
    ['solo', true],
    ['bots', false],
    ['online', false],
  ] as const)('a %s race parks: %s', (mode, parks) => {
    expect(CoastPolicy.parks(mode)).toBe(parks);
  });
});

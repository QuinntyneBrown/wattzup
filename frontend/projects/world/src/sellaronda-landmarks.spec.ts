import { describe, expect, it } from 'vitest';
import { nextSellaPass, SELLA_RONDA_PASSES, sellaMassifBearing } from './sellaronda-landmarks';

describe('SELLA_RONDA_PASSES', () => {
  it('lists all four clockwise Sella Ronda passes with their real Dolomite altitudes', () => {
    expect(SELLA_RONDA_PASSES.map((p) => p.altitudeMetres)).toEqual([1875, 2239, 2240, 2121]);
  });

  it.each([
    [0, 'campolongo'],
    [2500, 'pordoi'],
    [6000, 'sella'],
    [9000, 'gardena'],
    [11200, 'campolongo'],
  ])('names %s m along the loop as approaching %s', (metres, expectedId) => {
    expect(nextSellaPass(metres).id).toBe(expectedId);
  });

  it('keeps the central Sella massif on the rider right throughout the clockwise loop', () => {
    const start = sellaMassifBearing(200);
    const pordoi = sellaMassifBearing(4950);
    expect(start.side).toBe('right');
    expect(pordoi.radialAngle).toBeLessThan(start.radialAngle);
  });
});

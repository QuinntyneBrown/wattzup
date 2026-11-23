import { describe, expect, it } from 'vitest';
import {
  highestSellaPass,
  isHighWallSector,
  nextSellaPass,
  passAverageGradientPercent,
  passClimbLengthMetres,
  passClimbProgress,
  passVerticalGainMetres,
  SELLA_RONDA_PASSES,
  sellaMassifBearing,
  sellaSubpeaksForPass,
  totalSellaRondaClimbingMetres,
} from './sellaronda-landmarks';

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

  it('tracks exact climb progress up Passo Pordoi and returns null in valley flats', () => {
    expect(passClimbProgress(300)).toBeNull();
    const midPordoi = passClimbProgress(4125);
    expect(midPordoi?.pass.id).toBe('pordoi');
    expect(midPordoi?.fraction).toBeCloseTo(0.5, 3);
    expect(midPordoi?.remainingMetres).toBe(825);
  });

  it('lists Sass Pordoi and Piz Boè above Passo Pordoi and Torri del Sella above Passo Sella', () => {
    expect(sellaSubpeaksForPass('pordoi').map((p) => p.name)).toContain('Sass Pordoi');
    expect(sellaSubpeaksForPass('sella').map((p) => p.name)).toContain(
      'Torri del Sella (Terza Torre)',
    );
    expect(passClimbLengthMetres('pordoi')).toBe(1650);
    expect(isHighWallSector(7750)).toBe(true);
    expect(isHighWallSector(3120)).toBe(false);
    expect(highestSellaPass().id).toBe('sella');
    expect(highestSellaPass().altitudeMetres).toBe(2240);
    expect(passVerticalGainMetres('sella')).toBe(775);
    expect(passVerticalGainMetres('campolongo')).toBe(307);
    expect(passAverageGradientPercent('pordoi')).toBeGreaterThan(6.5);
    expect(passAverageGradientPercent('campolongo')).toBeGreaterThan(5.0);
    expect(totalSellaRondaClimbingMetres()).toBe(2277);
  });
});

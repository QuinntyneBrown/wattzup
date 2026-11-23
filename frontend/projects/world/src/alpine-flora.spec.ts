import { describe, expect, it } from 'vitest';
import {
  characteristicFaunaAtAltitude,
  dolomiteFloraZone,
  dominantConiferSpecies,
  edelweissHabitatScore,
  growingSeasonDays,
  hayHarvestMonth,
  isAlpenroseInBloom,
  larchAutumnGoldRatio,
  mugoPineCoverWeight,
  tabiaBarnDensityWeight,
  treeLineDensity,
  wildflowerBloomIntensity,
} from './alpine-flora';

describe('dolomiteFloraZone', () => {
  it.each([
    [1568, 'valley-meadow'],
    [1875, 'spruce-larch'],
    [2240, 'krummholz-pasture'],
    [2950, 'dolomite-scree'],
  ] as const)('maps %d m ASL to %s', (alt, expected) => {
    expect(dolomiteFloraZone(alt)).toBe(expected);
  });

  it('tapers conifer density from full forest in Corvara to treeless above Passo Sella', () => {
    expect(treeLineDensity(1600)).toBe(1);
    expect(treeLineDensity(2035)).toBeCloseTo(0.5, 2);
    expect(treeLineDensity(2240)).toBe(0);
    expect(wildflowerBloomIntensity(1925)).toBe(1);
    expect(wildflowerBloomIntensity(2600)).toBe(0);
    expect(hayHarvestMonth(1550)).toBe('june');
    expect(hayHarvestMonth(2080)).toBe('august');
    expect(mugoPineCoverWeight(2200)).toBeCloseTo(1, 3);
    expect(mugoPineCoverWeight(1600)).toBe(0);
    expect(edelweissHabitatScore(2420)).toBeCloseTo(1, 3);
    expect(edelweissHabitatScore(1500)).toBe(0);
    expect(larchAutumnGoldRatio(180, 2000)).toBe(0);
    expect(larchAutumnGoldRatio(305, 2050)).toBeGreaterThan(0.9);
    expect(characteristicFaunaAtAltitude(1600)).toBe('haflinger-horses');
    expect(characteristicFaunaAtAltitude(2500)).toBe('rupicapra-chamois');
    expect(isAlpenroseInBloom(185)).toBe(true);
    expect(isAlpenroseInBloom(300)).toBe(false);
    expect(tabiaBarnDensityWeight(1860)).toBeCloseTo(1, 3);
    expect(tabiaBarnDensityWeight(2400)).toBe(0);
    expect(growingSeasonDays(1500)).toBeGreaterThan(growingSeasonDays(2240));
    expect(dominantConiferSpecies(1600)).toBe('picea-abies-spruce');
    expect(dominantConiferSpecies(2100)).toBe('pinus-cembra-arolla');
    expect(dominantConiferSpecies(2700)).toBe('none');
  });
});

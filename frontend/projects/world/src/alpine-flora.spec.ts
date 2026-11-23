import { describe, expect, it } from 'vitest';
import {
  dolomiteFloraZone,
  edelweissHabitatScore,
  hayHarvestMonth,
  mugoPineCoverWeight,
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
  });
});

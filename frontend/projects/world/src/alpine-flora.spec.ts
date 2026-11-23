import { describe, expect, it } from 'vitest';
import { dolomiteFloraZone } from './alpine-flora';

describe('dolomiteFloraZone', () => {
  it.each([
    [1568, 'valley-meadow'],
    [1875, 'spruce-larch'],
    [2240, 'krummholz-pasture'],
    [2950, 'dolomite-scree'],
  ] as const)('maps %d m ASL to %s', (alt, expected) => {
    expect(dolomiteFloraZone(alt)).toBe(expected);
  });
});

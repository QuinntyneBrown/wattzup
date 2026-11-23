import { type SunDisc, sunDisc } from './sun-disc';

describe('the sun going down: redder and flatter as it nears the horizon (L2-166 AC92)', () => {
  const at = (degrees: number): SunDisc => sunDisc(degrees, { tint: [1, 1, 1], flat: 1 });

  it('is as it was painted, and round, while it stands well clear of the horizon', () => {
    expect(at(6)).toEqual({ tint: [1, 1, 1], flat: 1 });
    expect(at(12)).toEqual({ tint: [1, 1, 1], flat: 1 });
  });

  it('is deep red on the horizon: its green and blue go, its red stays', () => {
    const low = at(1.2);
    expect(low.tint[0]).toBeGreaterThan(0.95);
    expect(low.tint[1]).toBeLessThan(0.7);
    expect(low.tint[2]).toBeLessThan(low.tint[1]);
    expect(low.tint[2]).toBeGreaterThan(0.2);
  });

  it('is flattened on the horizon, as the air bends its lower limb up: by a tenth or more, never by a quarter', () => {
    expect(at(1.2).flat).toBeLessThan(0.9);
    expect(at(1.2).flat).toBeGreaterThan(0.75);
    expect(at(0).flat).toBeGreaterThan(0.75);
  });

  it('reddens and flattens steadily as it sinks, and never jumps', () => {
    let last = at(6);
    for (let degrees = 5.9; degrees >= 0; degrees -= 0.1) {
      const now = at(degrees);
      expect(now.flat).toBeLessThanOrEqual(last.flat);
      expect(last.flat - now.flat).toBeLessThan(0.01);
      for (let part = 0; part < 3; part++) {
        expect(now.tint[part]!).toBeLessThanOrEqual(last.tint[part]!);
        expect(last.tint[part]! - now.tint[part]!).toBeLessThan(0.03);
      }
      last = { tint: [...now.tint] as [number, number, number], flat: now.flat };
    }
  });

  it('holds below the horizon', () => {
    expect(at(-3)).toEqual(at(0));
  });
});

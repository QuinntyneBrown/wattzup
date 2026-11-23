import { cloudDrift } from './cloud-drift';

describe('low cloud drifting across the painted sky (L2-166 AC81)', () => {
  it('has not moved before the clock starts', () => {
    expect(cloudDrift(0)).toBe(0);
    expect(cloudDrift(-10)).toBe(0);
  });

  it('drifts steadily one way, slowly: a degree or so in ten seconds', () => {
    const tenSeconds = ((cloudDrift(70) - cloudDrift(60)) * 180) / Math.PI;
    expect(tenSeconds).toBeGreaterThan(0.5);
    expect(tenSeconds).toBeLessThan(2.5);
    expect(cloudDrift(61) - cloudDrift(60)).toBeCloseTo(cloudDrift(301) - cloudDrift(300), 9);
  });

  it('never goes more than once round', () => {
    for (const time of [1, 500, 3000, 7200]) {
      expect(cloudDrift(time)).toBeGreaterThanOrEqual(0);
      expect(cloudDrift(time)).toBeLessThan(Math.PI * 2);
    }
  });
});

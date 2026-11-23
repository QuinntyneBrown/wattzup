import { describe, expect, it } from 'vitest';
import { paragliderPose, type ThermalOrbit } from './paraglider-flight';

const COL_RODELLA: ThermalOrbit = {
  center: [120, 220, -340],
  radiusX: 65,
  radiusZ: 45,
  liftAmplitude: 8,
  periodSeconds: 48,
};

describe('paragliderPose', () => {
  it('flies a bounded figure-eight thermal orbit with banked turns', () => {
    const p0 = paragliderPose(COL_RODELLA, 0);
    const p1 = paragliderPose(COL_RODELLA, 9);
    expect(Math.hypot(p1.x - p0.x, p1.z - p0.z)).toBeGreaterThan(20);
    expect(Math.abs(p1.bank)).toBeGreaterThan(0.01);
    expect(Math.abs(p1.bank)).toBeLessThanOrEqual(0.48);
  });

  it('freezes position and bank angle when reducedMotion is true', () => {
    const a = paragliderPose(COL_RODELLA, 4, 0.3, true);
    const b = paragliderPose(COL_RODELLA, 29, 0.3, true);
    expect(b).toEqual(a);
    expect(b.bank).toBe(0);
  });
});

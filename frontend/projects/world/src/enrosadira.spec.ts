import { describe, expect, it } from 'vitest';
import { altitudeAlpenglowWeight, cliffAspectIllumination, enrosadiraTint } from './enrosadira';

describe('enrosadiraTint', () => {
  it('progresses from pale dolomite through peak coral-rose (r > g > b) into violet twilight', () => {
    const day = enrosadiraTint(0);
    const rose = enrosadiraTint(0.7);
    const dusk = enrosadiraTint(1);
    expect(rose.r).toBeGreaterThan(day.r);
    expect(rose.r).toBeGreaterThan(rose.g);
    expect(dusk.b).toBeGreaterThan(dusk.g);
  });

  it('illuminates sun-facing west-southwest Dolomite walls and leaves opposite faces in shadow', () => {
    const az = (205 * Math.PI) / 180;
    expect(cliffAspectIllumination(Math.cos(az), Math.sin(az), az)).toBeCloseTo(1, 3);
    expect(cliffAspectIllumination(-Math.cos(az), -Math.sin(az), az)).toBe(0);
    expect(altitudeAlpenglowWeight(1600)).toBe(0);
    expect(altitudeAlpenglowWeight(3152)).toBe(1);
  });
});

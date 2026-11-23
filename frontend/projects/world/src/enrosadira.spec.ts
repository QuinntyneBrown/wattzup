import { describe, expect, it } from 'vitest';
import {
  altitudeAlpenglowWeight,
  beltOfVenusWeight,
  cliffAspectIllumination,
  dolomiaCarbonateReflectance,
  duskLightPoolFalloff,
  enrosadiraStageName,
  enrosadiraTint,
  snowfieldAlbedoTint,
  twilightZenithLuminance,
  valleyShadowDepth,
} from './enrosadira';

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
    expect(beltOfVenusWeight(0, Math.PI, 0.11)).toBeCloseTo(1, 3);
    expect(beltOfVenusWeight(Math.PI, Math.PI, 0.11)).toBe(0);
    const refl = dolomiaCarbonateReflectance();
    expect(refl.r).toBeGreaterThan(refl.g);
    expect(refl.g).toBeGreaterThan(refl.b);
    expect(duskLightPoolFalloff(0, 24)).toBe(1);
    expect(duskLightPoolFalloff(12, 24)).toBeCloseTo(0.25, 3);
    expect(duskLightPoolFalloff(30, 24)).toBe(0);
    expect(twilightZenithLuminance(0)).toBeGreaterThan(twilightZenithLuminance(1));
    expect(snowfieldAlbedoTint(0).b).toBeGreaterThan(snowfieldAlbedoTint(0).r);
    expect(snowfieldAlbedoTint(1).r).toBeGreaterThan(snowfieldAlbedoTint(1).b);
    expect(enrosadiraStageName(0.4)).toBe('coral-rose');
    expect(enrosadiraStageName(0.95)).toBe('alpine-dusk');
    expect(valleyShadowDepth(1550, 2)).toBe(1);
    expect(valleyShadowDepth(2950, 2)).toBe(0);
  });
});

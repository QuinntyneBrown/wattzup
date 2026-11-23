import { describe, expect, it } from 'vitest';
import {
  apexSpeedFactor,
  brakingDistanceMetres,
  centripetalGForce,
  classifyBendSeverity,
  countTornantiInCurvatures,
  downhillTerminalCoastKmh,
  hairpinApexExitWatts,
  isInsideRockfallGallery,
  leanAngleDegrees,
  maxSafeCornerSpeedKmh,
  outerVsInnerHairpinGradeRatio,
  recommendedHairpinLine,
  switchbackCadenceTargetRpm,
  tornanteRadiusMetres,
} from './hairpin-pacing';

describe('classifyBendSeverity', () => {
  it.each([
    [0, 'straight'],
    [0.005, 'sweeper'],
    [-0.01, 'curve'],
    [0.02, 'tornante'],
  ] as const)('classifies curvature %d rad/m as %s', (k, expected) => {
    expect(classifyBendSeverity(k)).toBe(expected);
  });

  it('moderates cornering speed smoothly as curvature tightens into a tornante', () => {
    expect(apexSpeedFactor(0)).toBe(1);
    expect(apexSpeedFactor(0.02)).toBeLessThan(apexSpeedFactor(0.005));
    expect(apexSpeedFactor(0.1)).toBeGreaterThanOrEqual(0.55);
    expect(switchbackCadenceTargetRpm(8, 0.02)).toBeGreaterThan(switchbackCadenceTargetRpm(8, 0));
    expect(leanAngleDegrees(11, 0.02)).toBeGreaterThan(10);
    expect(leanAngleDegrees(0, 0.03)).toBe(0);
    expect(brakingDistanceMetres(16, 8, -9)).toBeGreaterThan(brakingDistanceMetres(16, 8, 0));
    expect(tornanteRadiusMetres(0.02)).toBeCloseTo(50, 3);
    expect(tornanteRadiusMetres(0)).toBe(Number.POSITIVE_INFINITY);
    expect(outerVsInnerHairpinGradeRatio(15, 3.75)).toBeCloseTo(0.6, 2);
    const sampleK = Array.from({ length: 60 }, (_, i) => (i === 10 || i === 35 ? 0.025 : 0.002));
    expect(countTornantiInCurvatures(sampleK)).toBe(2);
    expect(isInsideRockfallGallery(4600)).toBe(true);
    expect(isInsideRockfallGallery(5000)).toBe(false);
    expect(centripetalGForce(12, 0.02)).toBeCloseTo(0.2936, 2);
    expect(recommendedHairpinLine(7, 0.022)).toBe('wide-climbing-arc');
    expect(recommendedHairpinLine(-7, 0.022)).toBe('late-apex-descent');
    expect(maxSafeCornerSpeedKmh(0.05, 0.65)).toBeLessThan(45);
    expect(maxSafeCornerSpeedKmh(0, 0.65)).toBe(75);
    expect(downhillTerminalCoastKmh(-7)).toBeGreaterThan(55);
    expect(downhillTerminalCoastKmh(4)).toBe(0);
    expect(hairpinApexExitWatts(250, 0.04, 7)).toBeGreaterThan(290);
  });
});

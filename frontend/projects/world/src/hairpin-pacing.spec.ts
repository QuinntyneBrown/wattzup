import { describe, expect, it } from 'vitest';
import {
  apexSpeedFactor,
  classifyBendSeverity,
  leanAngleDegrees,
  switchbackCadenceTargetRpm,
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
  });
});

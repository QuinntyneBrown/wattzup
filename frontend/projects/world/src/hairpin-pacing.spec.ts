import { describe, expect, it } from 'vitest';
import { classifyBendSeverity } from './hairpin-pacing';

describe('classifyBendSeverity', () => {
  it.each([
    [0, 'straight'],
    [0.005, 'sweeper'],
    [-0.01, 'curve'],
    [0.02, 'tornante'],
  ] as const)('classifies curvature %d rad/m as %s', (k, expected) => {
    expect(classifyBendSeverity(k)).toBe(expected);
  });
});

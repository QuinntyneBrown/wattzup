import { describe, expect, it } from 'vitest';
import {
  cadenceComplianceScore,
  classifySellaRidingPhase,
  loopCompletionFraction,
  recommendedRiderPosture,
} from './sellaronda-stages';

describe('sellaronda-stages', () => {
  it('distinguishes valley spins, switchback climbs, summit crests, and alpine descents', () => {
    expect(classifySellaRidingPhase(7.2, 600)).toBe('switchback-climb');
    expect(classifySellaRidingPhase(1.5, 40)).toBe('summit-crest');
    expect(classifySellaRidingPhase(-6.5, 800)).toBe('alpine-descent');
    expect(classifySellaRidingPhase(0.8, 900)).toBe('valley-spin');
  });

  it('recommends out-of-saddle surges on steep low-cadence ramps and aero tuck on fast descents', () => {
    expect(recommendedRiderPosture(8.0, 68)).toBe('out-of-saddle');
    expect(recommendedRiderPosture(-6.0, 95)).toBe('aero-tuck');
    expect(recommendedRiderPosture(4.5, 88)).toBe('seated-spin');
    expect(loopCompletionFraction(5825)).toBeCloseTo(0.5, 3);
    expect(cadenceComplianceScore(85, 85)).toBe(100);
    expect(cadenceComplianceScore(60, 85)).toBeLessThan(30);
  });
});

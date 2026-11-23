// Unit test (the slice's acceptance table: the segment card that shows it comes with slice 5.2)
// Traces to: L2-027 AC1; L2-089 AC1; L2-023 AC3
// Description: the plan's segment, its time left and progress, and its target power at any time of the ride clock,
// so a late tick still lands on the right segment.
import type { Plan } from '@telo/api';
import { planStateAt } from './plan-state';

const plan: Plan = {
  segments: [
    { kind: 'warm-up', duration: 60, level: 8, cadenceAim: 80 },
    { kind: 'work', duration: 30, level: 18, cadenceAim: 100 },
    { kind: 'recover', duration: 90, level: 6, cadenceAim: 72 },
  ],
};

describe('planStateAt', () => {
  it.each([
    [0, 0, 'warm-up', 60_000, 0],
    [59_999, 0, 'warm-up', 1, 59_999 / 60_000],
    [60_000, 1, 'work', 30_000, 0],
    [75_000, 1, 'work', 15_000, 0.5],
    [95_000, 2, 'recover', 85_000, 5 / 90],
    [179_999, 2, 'recover', 1, 179_999 / 90_000 - 1],
  ] as const)(
    'at %d ms is segment %d, %s, with %d ms left',
    (elapsed, index, kind, remainingMs, progress) => {
      const state = planStateAt(plan, elapsed);

      expect(state).toMatchObject({ index, segment: { kind }, remainingMs });
      expect(state?.progress).toBeCloseTo(progress, 6);
    },
  );

  it('gives the segment’s target power from its level and cadence aim (L2-023 AC3)', () => {
    expect(planStateAt(plan, 70_000)?.targetPower).toBe(334);
  });

  it('has no segment once the plan has ended', () => {
    expect(planStateAt(plan, 180_000)).toBeNull();
  });
});

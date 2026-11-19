import { tickStep, traceGeometry, yMaxFor } from './trace-geometry';
import { expandPlan } from './plan-expansion';
import { testIntervalsPlan, testWorkout } from './test-state';

describe('traceGeometry (L2-026)', () => {
  it('builds one block per segment with phase and past flags', () => {
    const g = traceGeometry(testWorkout(), 427);
    expect(g.blocks.length).toBe(17);
    expect(g.blocks[0]).toEqual({ start: 0, end: 180, value: 143, phase: 'easy', past: true });
    expect(g.blocks[1]).toEqual({ start: 180, end: 220, value: 334, phase: 'work', past: true });
    expect(g.blocks[2].phase).toBe('rest');
    expect(g.blocks[9].past).toBe(false);
    expect(g.total).toBe(760);
  });
  it('tops the y axis at max(300, ceil(max × 1.3 ÷ 100) × 100)', () => {
    expect(yMaxFor(327)).toBe(500);
    expect(yMaxFor(205)).toBe(300);
    expect(yMaxFor(0)).toBe(300);
  });
  it.each([
    [760, 120],
    [1800, 300],
    [4500, 600],
    [10800, 1800],
    [60, 120],
  ])('a %i s ride gets ticks every %i s', (total, step) => {
    expect(tickStep(total)).toBe(step);
  });
  it('places the default ride ticks every 2 minutes', () => {
    const g = traceGeometry(testWorkout(), 0);
    expect(g.ticks.map((t) => t.label)).toEqual([
      '0:00',
      '2:00',
      '4:00',
      '6:00',
      '8:00',
      '10:00',
      '12:00',
    ]);
    expect(g.ticks[1].percent).toBeCloseTo(15.79, 2);
  });
  it('keeps the Recover legend for an intervals plan', () => {
    const plan = testIntervalsPlan();
    const g = traceGeometry(testWorkout({ plan, segments: expandPlan(plan) }), 0);
    expect(g.legend).toEqual(['Actual', 'Work target', 'Recover']);
  });
  it('has a plan average and a legend per kind', () => {
    const g = traceGeometry(testWorkout(), 0);
    expect(g.planAverage).toBe(211);
    expect(g.legend).toEqual(['Actual', 'Work target', 'Recover']);
    const flat = traceGeometry(
      testWorkout({
        plan: {
          kind: 'flat',
          video: null,
          level: 12,
          minutes: 30,
          cadence: 85,
        },
      }),
      0,
    );
    expect(flat.legend).toEqual(['Actual', 'Work target']);
  });
});

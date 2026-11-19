import { SegmentChangeDetector } from './segment-change-detector';
import { expandPlan } from './plan-expansion';
import { testIntervalsPlan, testWorkout } from './test-state';

describe('SegmentChangeDetector (L2-027)', () => {
  it('ignores the first state', () => {
    expect(new SegmentChangeDetector().observe(testWorkout())).toBeNull();
  });
  it('ignores an unchanged segment', () => {
    const d = new SegmentChangeDetector();
    d.observe(testWorkout());
    expect(d.observe(testWorkout())).toBeNull();
  });
  it('reports a changed segment', () => {
    const d = new SegmentChangeDetector();
    d.observe(testWorkout({ segment: 9 }));
    expect(d.observe(testWorkout({ segment: 10 }))).toEqual({
      kind: 'rest',
      level: 6,
      duration: 20,
      round: 5,
      rounds: 8,
      last: false,
      next: { kind: 'work', level: 18 },
    });
  });
  it('counts the rounds of an intervals plan from its efforts (L2-027)', () => {
    const plan = testIntervalsPlan();
    const segments = expandPlan(plan);
    const d = new SegmentChangeDetector();
    d.observe(testWorkout({ plan, segments, segment: 0 }));
    expect(d.observe(testWorkout({ plan, segments, segment: 1 }))?.rounds).toBe(8);
  });
  it('ignores a change to no workout', () => {
    const d = new SegmentChangeDetector();
    d.observe(testWorkout());
    expect(d.observe(null)).toBeNull();
  });
  it('reports a replaced ride restarting at segment 0', () => {
    const d = new SegmentChangeDetector();
    d.observe(testWorkout({ segment: 9 }));
    expect(d.observe(testWorkout({ segment: 0 }))?.kind).toBe('warmup');
  });
});

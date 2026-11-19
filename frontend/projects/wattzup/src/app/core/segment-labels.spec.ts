import { kindLabel, nextLabel, phaseOf, roundLabel, statusBadge, toneOf } from './segment-labels';
import { expandPlan } from './plan-expansion';
import { testIntervalsPlan, testWorkout } from './test-state';

describe('segment-labels (L2-025)', () => {
  it.each([
    ['warmup', 'Warm-up', 'easy', 'easy'],
    ['work', 'Work', 'effort', 'work'],
    ['rest', 'Recover', 'easy', 'rest'],
    ['cooldown', 'Cool-down', 'easy', 'easy'],
    ['steady', 'Steady', 'effort', 'work'],
  ] as const)('%s', (kind, label, phase, tone) => {
    expect([kindLabel(kind), phaseOf(kind), toneOf(kind)]).toEqual([label, phase, tone]);
  });

  it('names the round for work and rest only', () => {
    const w = testWorkout();
    expect(roundLabel(w.segments[9], w.segments)).toBe('Round 5 of 8');
    expect(roundLabel(w.segments[10], w.segments)).toBe('Round 5 of 8');
    expect(roundLabel(w.segments[0], w.segments)).toBeNull();
  });

  it('counts the rounds of an intervals plan from its efforts (L2-025 AC1)', () => {
    const segments = expandPlan(testIntervalsPlan());
    expect(roundLabel(segments[1], segments)).toBe('Round 1 of 8');
    expect(roundLabel(segments[15], segments)).toBe('Round 8 of 8');
  });

  it('names the next segment, or null on the last', () => {
    const w = testWorkout();
    expect(nextLabel(w.segments, 9)).toEqual({
      kind: 'Recover',
      duration: '0:20',
      level: 6,
    });
    expect(nextLabel(w.segments, 16)).toBeNull();
  });

  it.each([
    ['running', null],
    ['paused', 'Paused'],
    ['waiting for bike', 'Waiting for bike'],
    ['paused: bike disconnected', 'Bike disconnected'],
    ['ended', 'Ended'],
    ['stopped', 'Ended'],
    ['ended: bike shut off', 'Bike shut off'],
  ] as const)('badge for %s is %s', (status, badge) => {
    expect(statusBadge(status)).toBe(badge);
  });
});

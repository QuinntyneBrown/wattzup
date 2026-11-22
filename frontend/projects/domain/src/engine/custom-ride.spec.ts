import type { CustomWorkoutDraft, Plan } from '@telo/api';
import { customWorkoutLabel, intervalPlace } from './custom-ride';
import {
  addRound,
  chooseMode,
  newCustomWorkout,
  removeRound,
  stepEffort,
  makeRoundsSame,
} from './custom-workout';
import { expandCustomWorkout } from './custom-plan';

const gcn = newCustomWorkout();

describe('customWorkoutLabel', () => {
  it('names GCN 30-min HIIT by its rounds, effort and recoveries from first to last (L2-101 AC1)', () => {
    expect(customWorkoutLabel(gcn)).toBe('HIIT · 8 × 0:30 · 3:00 → 1:30 recover');
  });

  it('names recoveries that are all one once', () => {
    expect(customWorkoutLabel(makeRoundsSame(gcn))).toBe('HIIT · 8 × 0:30 · 3:00 recover');
  });

  it('counts rounds whose efforts differ', () => {
    expect(customWorkoutLabel(stepEffort(gcn, 0, 1))).toMatch(/^HIIT · 8 rounds · /);
  });

  it('leaves the recoveries out with one round, whose recovery is not ridden', () => {
    let draft: CustomWorkoutDraft = gcn;
    for (let i = 7; i > 0; i--) draft = removeRound(draft, i);
    expect(customWorkoutLabel(draft)).toBe('HIIT · 1 × 0:30');
  });

  it('ignores the recovery of the last round', () => {
    expect(customWorkoutLabel(addRound(gcn))).toBe('HIIT · 9 × 0:30 · 3:00 → 1:30 recover');
  });

  it('names flat resistance by its level and minutes (L2-101 AC2)', () => {
    expect(customWorkoutLabel(chooseMode(gcn, 'flat'))).toBe('Flat · Level 12 · 30 min');
  });
});

describe('intervalPlace', () => {
  const plan: Plan = expandCustomWorkout(gcn);

  it('gives the warm-up no round, and the first effort next (L2-102 AC2)', () => {
    expect(intervalPlace(plan, 0)).toEqual({ round: null, next: plan.segments[1] });
  });

  it('gives an effort and the recovery after it the same round', () => {
    expect(intervalPlace(plan, 1).round).toEqual({ number: 1, of: 8 });
    expect(intervalPlace(plan, 2).round).toEqual({ number: 1, of: 8 });
    expect(intervalPlace(plan, 3).round).toEqual({ number: 2, of: 8 });
    expect(intervalPlace(plan, 15).round).toEqual({ number: 8, of: 8 });
  });

  it('gives the last segment nothing next', () => {
    expect(intervalPlace(plan, plan.segments.length - 1)).toEqual({ round: null, next: null });
  });
});

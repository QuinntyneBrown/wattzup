import { baseLevel, controlsState, planNote, stepLevel } from './resistance-controls';
import { testState, testWorkout } from './test-state';

describe('resistance-controls (L2-020, L2-047)', () => {
  it('steps from the reported resistance', () => {
    const s = testState({ resistance: 10, target_resistance: 10 });
    expect(stepLevel(s, 1)).toBe(11);
    expect(stepLevel(s, -1)).toBe(9);
  });
  it('steps from the target with no reported resistance', () => {
    expect(stepLevel(testState({ resistance: null, target_resistance: 15 }), 1)).toBe(16);
  });
  it('steps from 12 with neither', () => {
    const s = testState({ resistance: null, target_resistance: null });
    expect(baseLevel(s)).toBe(12);
    expect(stepLevel(s, 1)).toBe(13);
    expect(stepLevel(s, -1)).toBe(11);
  });
  it('clamps to 1-32', () => {
    expect(stepLevel(testState({ resistance: 32 }), 1)).toBe(32);
  });
  it('disables Lower at 1 and Raise at 32', () => {
    expect(controlsState(testState({ resistance: 1 }), true)).toMatchObject({
      lowerDisabled: true,
      raiseDisabled: false,
      pickerDisabled: false,
    });
    expect(controlsState(testState({ resistance: 32 }), true).raiseDisabled).toBe(true);
  });
  it('disables everything when commands are off', () => {
    expect(controlsState(testState(), false)).toEqual({
      lowerDisabled: true,
      raiseDisabled: true,
      pickerDisabled: true,
    });
  });
  it.each([
    [testWorkout(), 'Following the plan — levels change with each interval.', false],
    [
      testWorkout({
        plan: {
          kind: 'flat',
          video: null,
          level: 12,
          minutes: 30,
          cadence: 85,
        },
      }),
      'Holding a flat level for the whole ride.',
      false,
    ],
    [testWorkout({ mode: 'manual' }), 'Manual level. Plan takes over next interval.', true],
    [
      testWorkout({
        mode: 'manual',
        plan_level: 12,
        plan: {
          kind: 'flat',
          video: null,
          level: 12,
          minutes: 30,
          cadence: 85,
        },
      }),
      'Manual level. Plan was 12.',
      true,
    ],
    [null, 'Manual control — no plan is running.', false],
  ])('plan note %#', (workout, text, backToPlan) => {
    expect(planNote(testState({ workout }))).toEqual({ text, backToPlan });
  });
});

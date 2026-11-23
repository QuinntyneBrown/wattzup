import { chooseMode, newCustomWorkout, setVideoOn } from './custom-workout';
import { restoreCustomWorkout } from './restore-custom-workout';

/** A draft as the backend sends it back: JSON, so plain objects. */
const saved = (draft: object) => JSON.parse(JSON.stringify(draft)) as Record<string, unknown>;

describe('restoreCustomWorkout', () => {
  it('opens on a saved HIIT or flat workout as it was (L2-094 AC3)', () => {
    const hiit = newCustomWorkout();
    const flat = setVideoOn(chooseMode(hiit, 'flat'), true);
    expect(restoreCustomWorkout(saved(hiit))).toEqual(hiit);
    expect(restoreCustomWorkout(saved(flat))).toEqual(flat);
  });

  it.each([
    ['nothing', null],
    ['a list', []],
    ['an unknown mode', { ...newCustomWorkout(), mode: 'sprint' }],
    ['an unknown plan', { ...newCustomWorkout(), preset: 'zwift' }],
    ['no rounds', { ...newCustomWorkout(), rounds: [] }],
    ['an effort under 5 seconds', { ...newCustomWorkout(), rounds: [{ effort: 4, recovery: 60 }] }],
    ['a level over 32', { ...newCustomWorkout(), workLevel: 33 }],
    ['a level that is not whole', { ...newCustomWorkout(), recoverLevel: 6.5 }],
    ['a warm-up past 20 minutes', { ...newCustomWorkout(), warmUp: 1260 }],
    [
      'flat minutes as text',
      { ...newCustomWorkout(), flat: { level: 12, minutes: '30', cadence: 85 } },
    ],
    ['no video', { ...newCustomWorkout(), video: undefined }],
  ])('opens on GCN 30-min HIIT instead of %s', (_, value) => {
    expect(restoreCustomWorkout(value === null ? null : saved(value))).toBeNull();
  });

  it('keeps a negative offset at 0', () => {
    const draft = { ...newCustomWorkout(), video: { on: true, link: 'x', offset: -3 } };
    expect(restoreCustomWorkout(saved(draft))?.video.offset).toBe(0);
  });
});

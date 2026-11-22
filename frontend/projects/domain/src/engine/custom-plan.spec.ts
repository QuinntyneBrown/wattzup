// Unit test
// Traces to: L2-096 AC3; L2-099 AC1, AC2, AC3; L2-100 AC1, AC2, AC3
// Description: GCN 30-min HIIT expands to 17 segments (warm-up, eight work and seven recover alternating, cool-down) of
// 30:00; at 6:52 it stands in segment 3 of 17, Recover, with 1:38 left; flat is one steady segment. A plan is refused
// for a segment under 5 seconds, a level outside 1 to 32 or a total outside 1 to 180 minutes. The preview reads the
// GCN and flat facts of L2-099.
import type { Plan } from '@telo/api';
import { chooseMode, newCustomWorkout, stepCoolDown, stepWarmUp } from './custom-workout';
import {
  CUSTOM_CADENCE_AIMS,
  customWorkoutPreview,
  expandCustomWorkout,
  validatePlan,
} from './custom-plan';
import { planStateAt } from './plan-state';

describe('custom plan', () => {
  const gcn = newCustomWorkout();

  it('expands GCN 30-min HIIT to 17 segments of 30:00 (L2-100 AC1, L2-096 AC3)', () => {
    const plan = expandCustomWorkout(gcn);

    expect(plan.segments.map((segment) => segment.kind)).toEqual([
      'warm-up',
      ...Array.from({ length: 7 }, () => ['work', 'recover']).flat(),
      'work',
      'cool-down',
    ]);
    expect(plan.segments[0]).toEqual({ kind: 'warm-up', duration: 300, level: 8, cadenceAim: 80 });
    expect(plan.segments[1]).toEqual({
      kind: 'work',
      duration: 30,
      level: 24,
      cadenceAim: CUSTOM_CADENCE_AIMS.work,
    });
    expect(plan.segments[2]).toEqual({ kind: 'recover', duration: 180, level: 6, cadenceAim: 72 });
    expect(plan.segments[16]).toEqual({
      kind: 'cool-down',
      duration: 360,
      level: 6,
      cadenceAim: 85,
    });
    expect(plan.segments.reduce((total, segment) => total + segment.duration, 0)).toBe(1800);
  });

  it('stands in segment 3 of 17, Recover, with 1:38 left at 6:52 (L2-100 AC2)', () => {
    const state = planStateAt(expandCustomWorkout(gcn), (6 * 60 + 52) * 1000);

    expect(state?.index).toBe(2);
    expect(state?.segment.kind).toBe('recover');
    expect(state?.remainingMs).toBe(98_000);
  });

  it('leaves out a warm-up or cool-down of 0:00', () => {
    let none = gcn;
    for (let i = 0; i < 10; i++) none = stepCoolDown(stepWarmUp(none, -1), -1);

    const kinds = expandCustomWorkout(none).segments.map((segment) => segment.kind);

    expect(kinds[0]).toBe('work');
    expect(kinds.at(-1)).toBe('work');
  });

  it('expands flat resistance to one steady segment (L2-097 AC1)', () => {
    expect(expandCustomWorkout(chooseMode(gcn, 'flat')).segments).toEqual([
      { kind: 'steady', duration: 1800, level: 12, cadenceAim: 85 },
    ]);
  });

  const plan = (...segments: [number, number][]): Plan => ({
    segments: segments.map(([duration, level]) => ({
      kind: 'steady',
      duration,
      level,
      cadenceAim: 85,
    })),
  });

  it.each([
    ['a valid plan', plan([60, 12]), []],
    ['a segment under 5 seconds', plan([4, 12], [600, 12]), ['segment-too-short']],
    ['a level of 0', plan([600, 0]), ['level-out-of-range']],
    ['a level of 33', plan([600, 33]), ['level-out-of-range']],
    ['a total under a minute', plan([59, 12]), ['total-out-of-range']],
    ['a total of 180 minutes', plan([10_800, 12]), []],
    ['a total over 180 minutes', plan([10_801, 12]), ['total-out-of-range']],
  ] as const)('validates %s (L2-100 AC3)', (_, given, problems) => {
    expect(validatePlan(given)).toEqual(problems);
  });

  it('previews GCN 30-min HIIT (L2-099 AC1, AC3)', () => {
    const preview = customWorkoutPreview(gcn, expandCustomWorkout(gcn), 'Synced from 0:12.0');

    expect(preview.totalSeconds).toBe(1800);
    expect(preview.facts).toEqual([
      { name: 'Structure', value: '8 × 0:30 · 3:00 → 1:30 recover' },
      { name: 'Time under load', value: '4:00' },
      { name: 'Video', value: 'Synced from 0:12.0' },
      { name: 'Peak resistance', value: 'Level 24' },
      { name: 'Expected avg power', value: '~154 W' },
      { name: 'Expected energy', value: '~276 kcal' },
    ]);
  });

  it('previews flat at level 12 for 30 min at 85 rpm, with no time under load (L2-099 AC2)', () => {
    const flat = chooseMode(gcn, 'flat');

    expect(customWorkoutPreview(flat, expandCustomWorkout(flat), 'Off').facts).toEqual([
      { name: 'Structure', value: 'Level 12 throughout' },
      { name: 'Video', value: 'Off' },
      { name: 'Peak resistance', value: 'Level 12' },
      { name: 'Expected avg power', value: '~205 W' },
      { name: 'Expected energy', value: '~367 kcal' },
    ]);
  });
});

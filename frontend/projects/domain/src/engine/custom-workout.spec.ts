// Unit test
// Traces to: L2-094 AC3; L2-095 AC1 to AC7; L2-096 AC1, AC2; L2-097 AC1, AC2
// Description: a new custom workout is GCN 30-min HIIT with its levels, warm-up, cool-down and flat settings; each plan
// loads its rounds; every setting steps by its step within its bounds; adding, removing and evening out rounds; a change
// to the rounds marks the plan edited and choosing a plan clears it.
import {
  CUSTOM_WORKOUT_LIMITS,
  HIIT_PRESETS,
  addRound,
  canStep,
  choosePreset,
  makeRoundsSame,
  newCustomWorkout,
  removeRound,
  setOffset,
  setVideoLink,
  setVideoOn,
  setFlatLevel,
  setWorkLevel,
  stepCoolDown,
  stepEffort,
  stepFlatCadence,
  stepFlatMinutes,
  stepOffset,
  stepRecovery,
  stepWarmUp,
  videoFact,
  videoOf,
} from './custom-workout';

describe('custom workout', () => {
  const fresh = newCustomWorkout();

  it('starts from GCN 30-min HIIT, never blank (L2-094 AC3, L2-095 AC2, L2-096, L2-097 AC1)', () => {
    expect(fresh).toEqual({
      mode: 'hiit',
      preset: 'gcn30',
      edited: false,
      rounds: [180, 150, 150, 120, 120, 90, 90, 90].map((recovery) => ({ effort: 30, recovery })),
      workLevel: 24,
      recoverLevel: 6,
      warmUp: 300,
      coolDown: 360,
      flat: { level: 12, minutes: 30, cadence: 85 },
      video: { on: false, link: 'https://www.youtube.com/watch?v=QUoToFsMNig', offset: 0 },
    });
  });

  it.each([
    ['tabata', 'Tabata · Telo Ride', 8, 20, 15],
    ['forty-twenty', '40 / 20 · Telo Ride', 10, 40, 20],
    ['minute-on', 'Minute on · Telo Ride', 10, 60, 60],
    ['long-climbs', 'Long climbs · Telo Ride', 4, 300, 180],
  ] as const)(
    'loads %s: %s, %i rounds of %is and %is, keeping the levels (L2-095 AC7)',
    (id, title, count, effort, recovery) => {
      const edited = stepWarmUp(stepEffort(fresh, 0, 1), 1);

      const chosen = choosePreset(edited, id);

      expect(HIIT_PRESETS.find((preset) => preset.id === id)?.title).toBe(title);
      expect(chosen.rounds).toEqual(Array.from({ length: count }, () => ({ effort, recovery })));
      expect(chosen.edited).toBe(false);
      expect(chosen.warmUp).toBe(360);
      expect(chosen.workLevel).toBe(24);
    },
  );

  it.each([
    ['effort up', (d: typeof fresh) => stepEffort(d, 0, 1), 35],
    ['effort down', (d: typeof fresh) => stepEffort(d, 0, -1), 25],
  ])('steps the %s by 0:05, and marks the plan edited (L2-095 AC3, AC6)', (_, edit, effort) => {
    const changed = edit(fresh);

    expect(changed.rounds[0]!.effort).toBe(effort);
    expect(changed.rounds[1]).toEqual(fresh.rounds[1]);
    expect(changed.edited).toBe(true);
  });

  it.each([
    [
      'effort',
      5,
      300,
      (d: typeof fresh, dir: 1 | -1) => stepEffort(d, 0, dir),
      (d: typeof fresh) => d.rounds[0]!.effort,
    ],
    [
      'recovery',
      15,
      600,
      (d: typeof fresh, dir: 1 | -1) => stepRecovery(d, 0, dir),
      (d: typeof fresh) => d.rounds[0]!.recovery,
    ],
    ['warm-up', 0, 1200, stepWarmUp, (d: typeof fresh) => d.warmUp],
    ['cool-down', 0, 1200, stepCoolDown, (d: typeof fresh) => d.coolDown],
    ['flat duration', 5, 120, stepFlatMinutes, (d: typeof fresh) => d.flat.minutes],
    ['flat cadence', 40, 120, stepFlatCadence, (d: typeof fresh) => d.flat.cadence],
  ] as const)(
    'holds the %s within %i to %i (L2-095 AC3, L2-096 AC2, L2-097 AC2)',
    (_, min, max, edit, read) => {
      let draft = fresh;
      for (let i = 0; i < 200; i++) draft = edit(draft, -1);
      expect(read(draft)).toBe(min);
      for (let i = 0; i < 200; i++) draft = edit(draft, 1);
      expect(read(draft)).toBe(max);
    },
  );

  it('steps recovery by 0:15, warm-up and cool-down by 1:00, duration and cadence by 5', () => {
    expect(stepRecovery(fresh, 1, -1).rounds[1]!.recovery).toBe(135);
    expect(stepWarmUp(fresh, 1).warmUp).toBe(360);
    expect(stepCoolDown(fresh, -1).coolDown).toBe(300);
    expect(stepFlatMinutes(fresh, 1).flat.minutes).toBe(35);
    expect(stepFlatCadence(fresh, -1).flat.cadence).toBe(80);
  });

  it('copies the last round, up to 30 rounds (L2-095 AC4)', () => {
    const added = addRound(stepEffort(fresh, 7, 1));

    expect(added.rounds).toHaveLength(9);
    expect(added.rounds[8]).toEqual({ effort: 35, recovery: 90 });
    let full = fresh;
    for (let i = 0; i < 40; i++) full = addRound(full);
    expect(full.rounds).toHaveLength(CUSTOM_WORKOUT_LIMITS.rounds.max);
  });

  it('removes a round, down to one (L2-095 AC4)', () => {
    const removed = removeRound(fresh, 0);

    expect(removed.rounds).toEqual(fresh.rounds.slice(1));
    expect(removed.edited).toBe(true);
    let one = fresh;
    for (let i = 0; i < 10; i++) one = removeRound(one, 0);
    expect(one.rounds).toHaveLength(1);
  });

  it('gives every round round 1’s effort and recovery (L2-095 AC5)', () => {
    const same = makeRoundsSame(stepEffort(fresh, 0, 1));

    expect(same.rounds).toEqual(Array.from({ length: 8 }, () => ({ effort: 35, recovery: 180 })));
  });

  it('holds levels within 1 to 32 (L2-096 AC1, L2-097 AC1)', () => {
    expect(setWorkLevel(fresh, 40).workLevel).toBe(32);
    expect(setWorkLevel(fresh, 0).workLevel).toBe(1);
    expect(setFlatLevel(fresh, 20).flat.level).toBe(20);
  });

  it('opens a step only away from its bound', () => {
    expect(canStep(5, CUSTOM_WORKOUT_LIMITS.effort, -1)).toBe(false);
    expect(canStep(5, CUSTOM_WORKOUT_LIMITS.effort, 1)).toBe(true);
    expect(canStep(300, CUSTOM_WORKOUT_LIMITS.effort, 1)).toBe(false);
  });

  it('reads the video as Off, Link needed or Synced from its offset (L2-098 AC3, L2-099 AC1, AC5)', () => {
    const on = setVideoOn(fresh, true);

    expect(videoFact(fresh)).toBe('Off');
    expect(videoFact(on)).toBe('Synced from 0:00.0');
    expect(videoOf(on)).toBe('QUoToFsMNig');
    expect(videoFact(stepOffset(stepOffset(on, 1), -1))).toBe('Synced from 0:00.0');
    expect(stepOffset(on, -1).video.offset).toBe(0);
    expect(videoFact(setOffset(on, 12.04))).toBe('Synced from 0:12.0');
    expect(videoFact(setVideoLink(on, 'https://vimeo.com/76979871'))).toBe('Link needed');
    expect(videoOf(setVideoOn(on, false))).toBeNull();
  });
});

import type { ClassEntry, WorkoutPlan } from '@wattzup/api';
import {
  cadenceLine,
  draftOf,
  isEdited,
  levelRows,
  shiftLevels,
  stretchLine,
  structureLine,
  toSetupDrafts,
  toStartRequest,
} from './class-draft';

const set = (rounds: number, rest: number, change: object = {}) => ({
  rounds,
  work_seconds: 30,
  work_level: 24,
  work_cadence: 98,
  rest_seconds: rest,
  rest_level: 6,
  rest_cadence: 72,
  ...change,
});

const HIIT_CARDIO: WorkoutPlan = {
  kind: 'intervals',
  warmup: { seconds: 300, level: 8, cadence: 80 },
  sets: [set(1, 180), set(2, 150), set(2, 120), set(2, 90), set(1, 0)],
  cooldown: { seconds: 360, level: 6, cadence: 70 },
  video: { video_id: 'QUoToFsMNig', start_seconds: 12 },
};

const FLAT: WorkoutPlan = {
  kind: 'flat',
  level: 12,
  minutes: 60,
  cadence: 85,
  speed: null,
  incline: null,
  video: null,
};

const HIIT: WorkoutPlan = {
  kind: 'hiit',
  rounds: 8,
  work_seconds: 40,
  rest_seconds: 20,
  work_level: 18,
  rest_level: 6,
  warmup: true,
  cooldown: false,
  work_speed: null,
  rest_speed: null,
  work_incline: null,
  rest_incline: null,
  video: null,
};

function classOf(plan: WorkoutPlan): ClassEntry {
  return {
    id: 'a-class',
    title: 'A Class',
    channel: 'GCN Training',
    focus: 'HIIT',
    description: '',
    shelf: { id: '30-min', title: '30 min', tagline: '' },
    plan,
  };
}

describe('class-draft (L2-080)', () => {
  it('starts from the class: its plan, its link and its start point (AC2, AC3)', () => {
    expect(draftOf(classOf(HIIT_CARDIO))).toEqual({
      plan: HIIT_CARDIO,
      url: 'https://www.youtube.com/watch?v=QUoToFsMNig',
      start: 12,
    });
    expect(draftOf(classOf(FLAT))).toEqual({ plan: FLAT, url: '', start: 0 });
  });

  it('shows Work and Recover rows at the highest level of each, or one Steady row (AC7, AC8)', () => {
    expect(levelRows(HIIT_CARDIO)).toEqual([
      { name: 'Work', level: 24, canLower: true, canRaise: true },
      { name: 'Recover', level: 6, canLower: true, canRaise: true },
    ]);
    expect(levelRows(FLAT)).toEqual([
      { name: 'Steady', level: 12, canLower: true, canRaise: true },
    ]);
    expect(levelRows({ ...FLAT, level: 32 })[0]).toMatchObject({ canRaise: false });
    expect(levelRows({ ...HIIT, rest_level: 1 })[1]).toMatchObject({ canLower: false });
  });

  it.each([
    ['intervals with shrinking recovers', HIIT_CARDIO, '8 × 0:30 · 3:00 → 1:30 recover'],
    [
      'intervals with equal recovers',
      { ...HIIT_CARDIO, sets: [set(4, 60), set(2, 60), set(1, 0)] },
      '7 × 0:30 / 1:00',
    ],
    ['hiit', HIIT, '8 × 0:40 / 0:20'],
    ['flat', FLAT, 'Level 12 throughout'],
  ] as const)('writes the structure of %s (AC6)', (_, plan, line) => {
    expect(structureLine(plan as WorkoutPlan)).toBe(line);
  });

  it('writes the cadence from the first work and recover aims, or the steady aim (AC6)', () => {
    expect(cadenceLine(HIIT_CARDIO)).toBe('98 / 72 rpm');
    expect(cadenceLine(FLAT)).toBe('85 rpm');
    expect(cadenceLine(HIIT)).toMatch(/^\d+ \/ \d+ rpm$/);
  });

  it('writes the warm-up and cool-down, each only when present (AC6)', () => {
    expect(stretchLine(HIIT_CARDIO)).toBe('5:00 warm-up · 6:00 cool-down');
    expect(stretchLine({ ...HIIT_CARDIO, cooldown: null })).toBe('5:00 warm-up');
    expect(stretchLine(HIIT)).toMatch(/^\d+:\d\d warm-up$/);
    expect(stretchLine(FLAT)).toBeNull();
  });

  it('moves every effort and every recover, never the warm-up or cool-down (AC7)', () => {
    const up = shiftLevels(HIIT_CARDIO, 'Work', 1);
    expect(up.kind === 'intervals' && up.sets.map((s) => s.work_level)).toEqual([
      25, 25, 25, 25, 25,
    ]);
    expect(up.kind === 'intervals' && up.warmup?.level).toBe(8);
    expect(up.kind === 'intervals' && up.cooldown?.level).toBe(6);
    const down = shiftLevels(HIIT_CARDIO, 'Recover', -1);
    expect(down.kind === 'intervals' && down.sets.map((s) => s.rest_level)).toEqual([
      5, 5, 5, 5, 5,
    ]);
    expect(shiftLevels(HIIT, 'Work', 1)).toMatchObject({ work_level: 19, rest_level: 6 });
    expect(shiftLevels(HIIT, 'Recover', -1)).toMatchObject({ work_level: 18, rest_level: 5 });
  });

  it('moves the flat level with the Steady row (AC8)', () => {
    expect(shiftLevels(FLAT, 'Steady', 1)).toMatchObject({ level: 13 });
  });

  it.each([
    ['Work', 1, { ...HIIT, work_level: 32 }],
    ['Recover', -1, { ...HIIT, rest_level: 1 }],
    ['Steady', 1, { ...FLAT, level: 32 }],
    ['Steady', -1, { ...FLAT, level: 1 }],
  ] as const)('keeps %s within 1 to 32 (dir %d)', (row, dir, plan) => {
    expect(shiftLevels(plan as WorkoutPlan, row, dir)).toBe(plan);
  });

  it('is edited when a level, the link or the start point differs from the class (AC9)', () => {
    const entry = classOf(HIIT_CARDIO);
    const draft = draftOf(entry);
    expect(isEdited(draft, entry)).toBe(false);
    expect(isEdited({ ...draft, plan: shiftLevels(draft.plan, 'Work', 1) }, entry)).toBe(true);
    expect(isEdited({ ...draft, url: '' }, entry)).toBe(true);
    expect(isEdited({ ...draft, start: 12.5 }, entry)).toBe(true);
    expect(isEdited({ ...draft, url: ` ${draft.url} ` }, entry)).toBe(false);
  });

  it('starts the plan as shown with the link, or with no video for a link that is not YouTube (AC4, AC10)', () => {
    const draft = { ...draftOf(classOf(HIIT_CARDIO)), start: 12.5 };
    expect(toStartRequest(draft)).toEqual({
      ...HIIT_CARDIO,
      video: { url: 'https://www.youtube.com/watch?v=QUoToFsMNig', start_seconds: 12.5 },
    });
    expect(toStartRequest({ ...draft, url: 'https://vimeo.com/76979871' }).video).toBeNull();
    expect(toStartRequest({ ...draft, url: '' }).video).toBeNull();
  });

  it('fills the Intervals draft and the video for an intervals class (AC12)', () => {
    const drafts = toSetupDrafts(draftOf(classOf(HIIT_CARDIO)));
    expect(drafts.plan).toMatchObject({ mode: 'intervals', preset: null });
    expect(drafts.intervals).toEqual({
      preset: null,
      warmup: { on: true, seconds: 300, level: 8, cadence: 80 },
      sets: HIIT_CARDIO.kind === 'intervals' ? HIIT_CARDIO.sets : [],
      cooldown: { on: true, seconds: 360, level: 6, cadence: 70 },
    });
    expect(drafts.video).toEqual({
      on: true,
      url: 'https://www.youtube.com/watch?v=QUoToFsMNig',
      start: 12,
    });
  });

  it('keeps a missing warm-up off in the Intervals draft (AC12)', () => {
    const plan = { ...HIIT_CARDIO, warmup: null } as WorkoutPlan;
    expect(toSetupDrafts(draftOf(classOf(plan))).intervals?.warmup.on).toBe(false);
  });

  it('fills the HIIT fields for a hiit class (AC12)', () => {
    expect(toSetupDrafts(draftOf(classOf(HIIT)))).toMatchObject({
      plan: {
        mode: 'hiit',
        preset: null,
        rounds: '8',
        work: '0:40',
        rest: '0:20',
        workLevel: 18,
        restLevel: 6,
        warmup: true,
        cooldown: false,
      },
      intervals: null,
      video: { on: false },
    });
  });

  it('fills the Flat fields for a flat class (AC12)', () => {
    expect(toSetupDrafts(draftOf(classOf(FLAT))).plan).toMatchObject({
      mode: 'flat',
      flatLevel: 12,
      minutes: '60 min',
      cadence: '85 rpm',
    });
  });
});

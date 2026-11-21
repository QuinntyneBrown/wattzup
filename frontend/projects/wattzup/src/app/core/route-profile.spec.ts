import type { Segment } from '@wattzup/api';
import {
  expectedSpeed,
  profileAt,
  routeProfile,
  routeProfileView,
  type RouteProfile,
} from './route-profile';
import { targetGrade, worldById } from './worlds';

const seg = (
  kind: Segment['kind'],
  start: number,
  duration: number,
  level: number,
  cadence: number,
  round: number | null = null,
): Segment => ({ kind, start, duration, level, cadence, round });

/** 30 Minute HIIT Cardio, as the backend expands it (an `intervals` plan). */
const hiitCardio: Segment[] = [
  seg('warmup', 0, 300, 18, 80),
  ...[180, 150, 150, 120, 120, 90, 90].flatMap((rest, i, all) => {
    const start = 300 + all.slice(0, i).reduce((sum, r) => sum + 30 + r, 0);
    return [seg('work', start, 30, 24, 98, i + 1), seg('rest', start + 30, rest, 10, 72, i + 1)];
  }),
  seg('work', 1410, 30, 24, 98, 8),
  seg('cooldown', 1440, 360, 6, 70),
];

/** The plan the Old Town mock is drawn from: the same shape at warm-up 8, work 24, recover 6. */
const oldTownMock: Segment[] = hiitCardio.map((s) => ({
  ...s,
  level: { warmup: 8, work: 24, rest: 6, cooldown: 6, steady: 0 }[s.kind],
}));

/** A `hiit` plan: 2 × 40 s / 20 s, no warm-up. */
const hiit: Segment[] = [
  seg('work', 0, 40, 20, 95, 1),
  seg('rest', 40, 20, 6, 70, 1),
  seg('work', 60, 40, 20, 95, 2),
  seg('rest', 100, 20, 6, 70, 2),
];

/** A `flat` plan: one steady level. */
const flat: Segment[] = [seg('steady', 0, 120, 12, 85)];

const oldTown = worldById('oldtown');

describe('expectedSpeed (L2-101 AC3)', () => {
  it('is 10 × ∛(estimate ÷ 20) ÷ 3.6 m/s', () => {
    // estimate = round(80 × (0.55 + 18 × 0.155)) = 267 W
    expect(expectedSpeed(seg('warmup', 0, 1, 18, 80))).toBeCloseTo(
      (10 * Math.cbrt(267 / 20)) / 3.6,
      9,
    );
  });

  it('floors the estimate at 1 W', () => {
    expect(expectedSpeed(seg('rest', 0, 1, 1, 0))).toBeCloseTo((10 * Math.cbrt(1 / 20)) / 3.6, 9);
  });
});

describe('routeProfile (L2-101 AC3)', () => {
  it('walks a flat plan at one speed, easing its grade from steady', () => {
    const world = worldById('dolomites');
    const profile = routeProfile(world, flat);
    const v = expectedSpeed(flat[0]!);

    expect(profile.grade).toHaveLength(120);
    expect(profile.metres).toBeCloseTo(120 * v, 6);
    // Second 0: g starts at grade[steady] and moves 0.12 of the way to the target at s 0.
    const g0 = 0.8 + 0.12 * (targetGrade(world, 'steady', 0) - 0.8);
    expect(profile.grade[0]).toBeCloseTo(g0, 9);
    expect(profile.elevation[0]).toBeCloseTo((g0 / 100) * v, 9);
  });

  it('adds only the rises above 0 to climbed', () => {
    const profile = routeProfile(worldById('docklands'), hiit);
    let climbed = 0;
    let last = 0;
    profile.elevation.forEach((e, t) => {
      climbed += Math.max(0, e - last);
      last = e;
      expect(profile.climbed[t]).toBeCloseTo(climbed, 9);
    });
    // A docklands rest eases off towards −2 %, so the road tips downhill in the recovery.
    expect(profile.grade[59]!).toBeLessThan(0);
  });

  it('builds the Old Town profile of 30 Minute HIIT Cardio second by second', () => {
    const profile = routeProfile(oldTown, hiitCardio);
    expect(profile.grade).toHaveLength(1800);
    expect(profileAt(profile, 290)).toEqual({
      grade: profile.grade[290],
      climbed: profile.climbed[290],
    });
  });
});

describe('profileAt', () => {
  const profile: RouteProfile = {
    elevation: [1, 2, 3],
    grade: [0.1, 0.2, 0.3],
    climbed: [1, 2, 3],
    metres: 30,
  };

  it.each([
    [-5, 0.1],
    [1.7, 0.2],
    [99, 0.3],
  ])('reads second %d clamped to the plan', (t, grade) => {
    expect(profileAt(profile, t).grade).toBe(grade);
  });
});

describe('routeProfileView (L2-106)', () => {
  const view = (t: number) => routeProfileView(routeProfile(oldTown, oldTownMock), oldTownMock, t);

  it('reads the climbed and label of the Old Town mock at 4:50', () => {
    const v = view(290);
    // The gradient at second 290 by L2-101 AC3; the mock's still reads +0.5 %.
    expect(v.gradeText).toBe('+0.9%');
    expect(v.climbedText).toBe('9 m climbed');
    expect(v.label).toBe('Route profile, 43 m of elevation');
    expect(v.width).toBe(1800);
    expect(v.doneWidth).toBe(290);
    expect(v.playhead.x).toBe(290);
  });

  it('draws the area from the floor through every sixth second, as the mock', () => {
    const area = view(290).area;
    expect(area.startsWith('M0 92 L0 87.95 L6 87.66 L12 87.36')).toBe(true);
    expect(area).toContain('L300 70.33 L306 67.65');
    expect(area.endsWith('L1794 14.68 L1799 14.80 L1800 92 Z')).toBe(true);
  });

  it('draws one strip rectangle per segment in its tone', () => {
    expect(view(0).strip.slice(0, 3)).toEqual([
      { x: 0, width: 300, tone: 'is-easy' },
      { x: 300, width: 30, tone: 'is-work' },
      { x: 330, width: 180, tone: 'is-rest' },
    ]);
  });

  it.each([
    [0.04, '+0.0%'],
    [-0.04, '+0.0%'],
    [3, '+3.0%'],
    [-1.46, '-1.5%'],
  ])('writes grade %d as %s', (grade, text) => {
    const profile: RouteProfile = { elevation: [0], grade: [grade], climbed: [0], metres: 1 };
    expect(routeProfileView(profile, [seg('steady', 0, 1, 1, 1)], 0).gradeText).toBe(text);
  });
});

describe('routeProfile and routeProfileView memoization', () => {
  it('reuses the memoized RouteProfile and static strip array across ticks of the same ride', () => {
    const first = routeProfile(oldTown, hiitCardio);
    const second = routeProfile(oldTown, hiitCardio);
    expect(second).toBe(first);

    const v0 = routeProfileView(first, hiitCardio, 10);
    const v1 = routeProfileView(second, hiitCardio, 25);
    expect(v1.strip).toBe(v0.strip);
    expect(v1.area).toBe(v0.area);
    expect(v1.doneWidth).toBe(25);
  });
});

// Unit test
// Traces to: L2-062 AC1, AC2
// Description: main's route profile, copied: the road eases towards the world's grade for each segment at the
// segment's expected speed, giving the elevation, grade and metres climbed; the view draws it for the route panel.
import type { MapTerrain, Segment } from '@telo/api';
import {
  expectedSpeed,
  gradeTone,
  profileAt,
  type RouteProfile,
  routeProfile,
  routeProfileView,
  targetGrade,
} from './route-profile';

const seg = (
  kind: Segment['kind'],
  duration: number,
  level: number,
  cadenceAim: number,
): Segment => ({
  kind,
  duration,
  level,
  cadenceAim,
});

/** The race's plan, the one main's Old Town mock is drawn from: warm-up 8, work 24, recover 6, cool-down 6. */
const oldTownPlan: Segment[] = [
  seg('warm-up', 300, 8, 80),
  ...[180, 150, 150, 120, 120, 90, 90].flatMap((rest) => [
    seg('work', 30, 24, 98),
    seg('recover', rest, 6, 72),
  ]),
  seg('work', 30, 24, 98),
  seg('cool-down', 360, 6, 70),
];

/** A `hiit` plan: 2 × 40 s / 20 s, no warm-up. */
const hiit: Segment[] = [
  seg('work', 40, 20, 95),
  seg('recover', 20, 6, 70),
  seg('work', 40, 20, 95),
  seg('recover', 20, 6, 70),
];

/** A `flat` plan: one steady level. */
const flat: Segment[] = [seg('steady', 120, 12, 85)];

const terrain = (
  warmUp: number,
  work: number,
  recover: number,
  coolDown: number,
  steady: number,
  roll: number,
): MapTerrain => ({
  grade: { 'warm-up': warmUp, work, recover, 'cool-down': coolDown, steady },
  roll,
});
const oldTown = terrain(0.5, 6, -1.5, 0, 0, 0.5);
const docklands = terrain(0.5, 5.5, -2, 0, 0, 0.6);
const dolomites = terrain(1, 2, 0, -1, 0.8, 2.4);

describe('expectedSpeed', () => {
  it('is 10 × ∛(estimate ÷ 20) ÷ 3.6 m/s', () => {
    // estimate = round(80 × (0.55 + 18 × 0.155)) = 267 W
    expect(expectedSpeed(seg('warm-up', 1, 18, 80))).toBeCloseTo(
      (10 * Math.cbrt(267 / 20)) / 3.6,
      9,
    );
  });

  it('floors the estimate at 1 W', () => {
    expect(expectedSpeed(seg('recover', 1, 1, 0))).toBeCloseTo((10 * Math.cbrt(1 / 20)) / 3.6, 9);
  });
});

describe('routeProfile', () => {
  it('walks a flat plan at one speed, easing its grade from steady', () => {
    const profile = routeProfile(dolomites, flat);
    const v = expectedSpeed(flat[0]!);

    expect(profile.grade).toHaveLength(120);
    expect(profile.metres).toBeCloseTo(120 * v, 6);
    // Second 0: g starts at grade[steady] and moves 0.12 of the way to the target at s 0.
    const g0 = 0.8 + 0.12 * (targetGrade(dolomites, 'steady', 0) - 0.8);
    expect(profile.grade[0]).toBeCloseTo(g0, 9);
    expect(profile.elevation[0]).toBeCloseTo((g0 / 100) * v, 9);
  });

  it('adds only the rises above 0 to climbed', () => {
    const profile = routeProfile(docklands, hiit);
    let climbed = 0;
    let last = 0;
    profile.elevation.forEach((e, t) => {
      climbed += Math.max(0, e - last);
      last = e;
      expect(profile.climbed[t]).toBeCloseTo(climbed, 9);
    });
    // A docklands recovery eases off towards −2 %, so the road tips downhill in it.
    expect(profile.grade[59]!).toBeLessThan(0);
  });

  it('builds the Old Town profile of the race plan second by second', () => {
    const profile = routeProfile(oldTown, oldTownPlan);
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

describe('routeProfileView', () => {
  const view = (t: number) => routeProfileView(routeProfile(oldTown, oldTownPlan), oldTownPlan, t);

  it('reads the climbed and label of the Old Town mock at 4:50', () => {
    const v = view(290);
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

  it('draws one strip rectangle per segment, by kind', () => {
    expect(view(0).strip.slice(0, 3)).toEqual([
      { x: 0, width: 300, kind: 'warm-up' },
      { x: 300, width: 30, kind: 'work' },
      { x: 330, width: 180, kind: 'recover' },
    ]);
  });

  it.each([
    [0.04, '+0.0%'],
    [-0.04, '+0.0%'],
    [3, '+3.0%'],
    [-1.46, '-1.5%'],
  ])('writes grade %d as %s', (grade, text) => {
    const profile: RouteProfile = { elevation: [0], grade: [grade], climbed: [0], metres: 1 };
    expect(routeProfileView(profile, [seg('steady', 1, 1, 1)], 0).gradeText).toBe(text);
  });
});

describe('gradeTone', () => {
  it.each([
    [-2.1, 'down'],
    [-1, 'flat'],
    [0.5, 'flat'],
    [2.99, 'flat'],
    [3, 'climb'],
    [4.8, 'climb'],
    [8, 'steep'],
    [9.2, 'steep'],
  ])('reads grade %d as %s', (grade, tone) => {
    expect(gradeTone(grade)).toBe(tone);
  });
});

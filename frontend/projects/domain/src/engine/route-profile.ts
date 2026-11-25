// The plan drawn as terrain: the route profile and its panel, copied from `main`'s route-profile.ts (L2-062).
// Changes from `main`: Telo Ride's segment (`cadenceAim`, no `start`) and kind names, the world's terrain from the map
// catalogue (`MapTerrain`), and a view shaped for the race's route panel (block race-route, `RouteProfileView`), with
// the grade's tone the panel colours it by.
import type { GradeTone, MapTerrain, RouteProfileView, Segment, SegmentKind } from '@telo/api';

/** The profile, one entry per second of the plan. */
export interface RouteProfile {
  /** Metres above the start, after each second. */
  readonly elevation: readonly number[];
  /** Gradient, in percent, during each second. */
  readonly grade: readonly number[];
  /** Sum of the rises above 0, up to and including each second. */
  readonly climbed: readonly number[];
  /** Length of the route. */
  readonly metres: number;
  /** Metres between authored elevations when the profile follows ridden distance. */
  readonly stepMetres?: number;
}

/** The power `main` expects of a segment: `max(0, round(cadence × (0.55 + level × 0.155)))`. */
function estimateWatts(cadence: number, level: number): number {
  return Math.max(0, Math.round(cadence * (0.55 + level * 0.155)));
}

/** The grade the road eases towards for a segment kind at `s` metres: the world's, with its roll laid over it. */
export function targetGrade(terrain: MapTerrain, kind: SegmentKind, s: number): number {
  return terrain.grade[kind] + terrain.roll * Math.sin(s / 310) * Math.cos(s / 870 + 1);
}

/** A segment's expected speed in m/s: `10 × ∛(max(estimate, 1) ÷ 20) ÷ 3.6`. */
export function expectedSpeed(segment: Segment): number {
  const watts = Math.max(estimateWatts(segment.cadenceAim, segment.level), 1);
  return (10 * Math.cbrt(watts / 20)) / 3.6;
}

const EASE = 0.12;

export function routeProfile(
  terrain: MapTerrain,
  segments: readonly Segment[],
  metres = 0,
): RouteProfile {
  const heights = terrain.elevation;
  if (heights && heights.length >= 2 && metres > 0) {
    const stepMetres = metres / (heights.length - 1);
    const grade = heights.slice(1).map((y, i) => (100 * (y - heights[i]!)) / stepMetres);
    grade.push(grade[grade.length - 1]!);
    let ascent = 0;
    const climbed = heights.map((height, i) => {
      if (i > 0) ascent += Math.max(0, height - heights[i - 1]!);
      return ascent;
    });
    return { elevation: heights, grade, climbed, metres, stepMetres };
  }
  const elevation: number[] = [];
  const grade: number[] = [];
  const climbed: number[] = [];
  let g = segments[0] ? terrain.grade[segments[0].kind] : 0;
  let s = 0;
  let e = 0;
  let up = 0;
  for (const segment of segments) {
    const v = expectedSpeed(segment);
    for (let i = 0; i < segment.duration; i++) {
      g += EASE * (targetGrade(terrain, segment.kind, s) - g);
      const rise = (g / 100) * v;
      e += rise;
      s += v;
      if (rise > 0) up += rise;
      elevation.push(e);
      grade.push(g);
      climbed.push(up);
    }
  }
  return { elevation, grade, climbed, metres: s };
}

/** The gradient and climbed at whole second `t`, clamped to the plan. */
export function profileAt(profile: RouteProfile, t: number): { grade: number; climbed: number } {
  const i = Math.min(Math.max(Math.floor(t), 0), profile.grade.length - 1);
  return { grade: profile.grade[i] ?? 0, climbed: profile.climbed[i] ?? 0 };
}

/** The SVG is one unit per second wide and 100 high: terrain from y 88 (lowest) to 10 (highest). */
const FLOOR = 92;
const LOW = 88;
const SPAN = 78;
const STEP = 6;

/** What the route panel draws at second `t` (L2-062 AC1, AC2). */
export function routeProfileView(
  profile: RouteProfile,
  segments: readonly Segment[],
  t: number,
  ridden = 0,
): RouteProfileView {
  const { elevation } = profile;
  const last = elevation.length - 1;
  const min = Math.min(0, ...elevation);
  const max = Math.max(0, ...elevation);
  const range = max - min;
  const y = (e: number) => (range > 0 ? LOW - ((e - min) / range) * SPAN : LOW);
  const points: string[] = [];
  for (let x = 0; x <= last; x += STEP) points.push(`L${x} ${y(elevation[x]!).toFixed(2)}`);
  if (last % STEP !== 0) points.push(`L${last} ${y(elevation[last]!).toFixed(2)}`);
  const width = elevation.length;
  const stepMetres = profile.stepMetres;
  const position = stepMetres ? ridden / stepMetres : t;
  const at = Math.min(Math.max(Math.floor(position), 0), Math.max(last, 0));
  const { grade, climbed } = profileAt(profile, at);
  let start = 0;
  const strip = segments.map((s) => {
    // Authored courses cover cadenceAim / 12 metres per second at target cadence.
    const span = stepMetres ? (s.duration * (s.cadenceAim / 12)) / stepMetres : s.duration;
    const bar = { x: start, width: span, kind: s.kind };
    start += span;
    return bar;
  });
  return {
    gradeText: gradeText(grade),
    gradeTone: gradeTone(grade),
    climbedText: `${Math.round(climbed)} m climbed`,
    label: `Route profile, ${Math.round(range)} m of elevation`,
    width,
    area: `M0 ${FLOOR} ${points.join(' ')} L${width} ${FLOOR} Z`,
    doneWidth: at,
    strip,
    playhead: { x: at, y: y(elevation[at] ?? 0) },
  };
}

/**
 * How the road reads (the design system's route-profile page): below −1 % downhill, from 3 % a climb, from 8 % steep,
 * and flat between.
 */
export function gradeTone(grade: number): GradeTone {
  if (grade < -1) return 'down';
  if (grade >= 8) return 'steep';
  if (grade >= 3) return 'climb';
  return 'flat';
}

function gradeText(grade: number): string {
  const fixed = grade.toFixed(1);
  return fixed === '-0.0' ? '+0.0%' : `${grade >= 0 ? '+' : ''}${fixed}%`;
}

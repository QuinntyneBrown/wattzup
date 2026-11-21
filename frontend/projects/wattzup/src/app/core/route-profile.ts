// The class drawn as terrain: the route profile and its panel (L2-101 AC3, L2-106).
import type { Segment } from '@wattzup/api';
import type { WorldRideProfile } from '@wattzup/components';
import { estimateWatts } from './plan-expansion';
import { profileTone } from './ride-preview';
import { targetGrade, type World } from './worlds';

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
}

interface StaticProfileGeometry {
  readonly min: number;
  readonly range: number;
  readonly label: string;
  readonly width: number;
  readonly area: string;
}

const profileCache = new WeakMap<readonly Segment[], Map<string, RouteProfile>>();
const geometryCache = new WeakMap<RouteProfile, StaticProfileGeometry>();
const stripCache = new WeakMap<readonly Segment[], WorldRideProfile['strip']>();

/** A segment's expected speed in m/s: `10 × ∛(max(estimate, 1) ÷ 20) ÷ 3.6`. */
export function expectedSpeed(segment: Segment): number {
  const watts = Math.max(estimateWatts(segment.cadence, segment.level), 1);
  return (10 * Math.cbrt(watts / 20)) / 3.6;
}

const EASE = 0.12;

export function routeProfile(world: World, segments: readonly Segment[]): RouteProfile {
  let byWorld = profileCache.get(segments);
  if (!byWorld) {
    byWorld = new Map();
    profileCache.set(segments, byWorld);
  }
  const hit = byWorld.get(world.id);
  if (hit) return hit;

  const elevation: number[] = [];
  const grade: number[] = [];
  const climbed: number[] = [];
  let g = segments[0] ? world.grade[segments[0].kind] : 0;
  let s = 0;
  let e = 0;
  let up = 0;
  for (const segment of segments) {
    const v = expectedSpeed(segment);
    for (let i = 0; i < segment.duration; i++) {
      g += EASE * (targetGrade(world, segment.kind, s) - g);
      const rise = (g / 100) * v;
      e += rise;
      s += v;
      if (rise > 0) up += rise;
      elevation.push(e);
      grade.push(g);
      climbed.push(up);
    }
  }
  const computedProfile: RouteProfile = { elevation, grade, climbed, metres: s };
  byWorld.set(world.id, computedProfile);
  return computedProfile;
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

function staticGeometryOf(profile: RouteProfile): StaticProfileGeometry {
  const hit = geometryCache.get(profile);
  if (hit) return hit;
  const { elevation } = profile;
  const last = elevation.length - 1;
  let min = 0;
  let max = 0;
  for (let i = 0; i <= last; i++) {
    const v = elevation[i]!;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min;
  const y = (e: number) => (range > 0 ? LOW - ((e - min) / range) * SPAN : LOW);
  const points: string[] = [];
  for (let x = 0; x <= last; x += STEP) points.push(`L${x} ${y(elevation[x]!).toFixed(2)}`);
  if (last >= 0 && last % STEP !== 0) points.push(`L${last} ${y(elevation[last]!).toFixed(2)}`);
  const width = elevation.length;
  const geometry: StaticProfileGeometry = {
    min,
    range,
    label: `Route profile, ${Math.round(range)} m of elevation`,
    width,
    area: `M0 ${FLOOR} ${points.join(' ')} L${width} ${FLOOR} Z`,
  };
  geometryCache.set(profile, geometry);
  return geometry;
}

function staticStripOf(segments: readonly Segment[]): WorldRideProfile['strip'] {
  const hit = stripCache.get(segments);
  if (hit) return hit;
  const strip = segments.map((s) => ({ x: s.start, width: s.duration, tone: profileTone(s.kind) }));
  stripCache.set(segments, strip);
  return strip;
}

/** What the route-profile panel draws at second `t` (L2-106 AC1–3). */
export function routeProfileView(
  profile: RouteProfile,
  segments: readonly Segment[],
  t: number,
): Omit<WorldRideProfile, 'distanceText'> {
  const { elevation } = profile;
  const last = elevation.length - 1;
  const geom = staticGeometryOf(profile);
  const at = Math.min(Math.max(Math.floor(t), 0), Math.max(last, 0));
  const { grade, climbed } = profileAt(profile, at);
  const elevationAt = elevation[at] ?? 0;
  const playheadY = geom.range > 0 ? LOW - ((elevationAt - geom.min) / geom.range) * SPAN : LOW;
  return {
    gradeText: gradeText(grade),
    climbedText: `${Math.round(climbed)} m climbed`,
    label: geom.label,
    width: geom.width,
    area: geom.area,
    doneWidth: at,
    strip: staticStripOf(segments),
    playhead: { x: at, y: playheadY },
  };
}

function gradeText(grade: number): string {
  const fixed = grade.toFixed(1);
  return fixed === '-0.0' ? '+0.0%' : `${grade >= 0 ? '+' : ''}${fixed}%`;
}

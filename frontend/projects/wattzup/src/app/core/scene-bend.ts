// The bend of the road ahead of the rider (L2-101 AC6, L2-110 AC9, ADR 0023). The street modules
// lay a straight road, `x` across it and `-metres` along it; `bendPoint` moves a point of that
// straight road onto the bending one. The vertex stage (world-bend.ts) follows it line for line,
// and the lamps and the camera use it here.
import type { World } from './worlds';

/** Samples from 40 m behind the rider, one every 4 m: to 468 m ahead. */
export const BEND_SAMPLES = 128;
export const BEND_FROM = -40;
export const BEND_STEP = 4;
/** Where the road strip ends; past it the heading eases to 0 by the last sample. */
export const ROAD_END = 300;
const FADE_END = BEND_FROM + (BEND_SAMPLES - 2) * BEND_STEP;
/**
 * On the inside of a bend, a point keeps its distance from the centre line out to this share of
 * the bend's radius, then eases towards `EASE_TO` of it and never reaches the bend's centre.
 */
export const EASE_FROM = 0.5;
export const EASE_TO = 0.85;
/** Below this curvature, per metre, a bend has no inside to ease towards. */
export const MIN_CURVATURE = 1e-4;

// Pre-allocated typed-array scratch buffers so bendAhead() allocates zero temporary arrays per frame.
const BEND_X = new Float64Array(BEND_SAMPLES);
const BEND_Z = new Float64Array(BEND_SAMPLES);
const BEND_CURV = new Float64Array(BEND_SAMPLES);

export interface BendPoint {
  readonly x: number;
  readonly z: number;
}

/** The road's heading at `s`, in degrees, positive to the rider's right (L2-101 AC6). */
export function heading(world: World, s: number): number {
  const { angle, length } = world.bend;
  if (angle === 0) return 0;
  return angle * Math.sin(s / length) * Math.cos(s / (2.7 * length) + 1);
}

/** How fast the road turns at `s`, in radians per metre, positive bending to the rider's right. */
export function curvature(world: World, s: number): number {
  return ((heading(world, s + 0.5) - heading(world, s - 0.5)) * Math.PI) / 180;
}

/**
 * How far a rider at `speed` m/s leans into the bend at `s`, in radians, positive to the right:
 * the bike tilts until gravity balances the turn, `atan(v² κ / g)`.
 */
export function lean(world: World, s: number, speed: number): number {
  return Math.atan((speed * speed * curvature(world, s)) / 9.81);
}

/** A bend's apex: where along the road it turns hardest, and which way. */
export interface Apex {
  /** Metres along the road. */
  readonly s: number;
  /** 1 for a right-hander, −1 for a left-hander. */
  readonly turn: 1 | -1;
}

/** A bend turning less than this, in radians per metre (0.15° a metre), has no corner to mark. */
export const APEX_MIN = (0.15 * Math.PI) / 180;
export const APEX_STEP = 2;

/** The apexes of the bends from `from` to `to` metres along the road, nearest first. */
export function apexes(world: World, from: number, to: number, limit = Infinity): Apex[] {
  if (world.bend.angle === 0 || limit <= 0) return [];
  const found: Apex[] = [];
  const start = Math.floor(from / APEX_STEP) * APEX_STEP;
  let before = Math.abs(curvature(world, start - APEX_STEP));
  let hereK = curvature(world, start);
  let here = Math.abs(hereK);
  for (let s = start; s <= to; s += APEX_STEP) {
    const nextK = curvature(world, s + APEX_STEP);
    const after = Math.abs(nextK);
    if (s >= from && here >= APEX_MIN && here > before && here >= after) {
      found.push({ s, turn: hereK > 0 ? 1 : -1 });
      if (found.length >= limit) break;
    }
    before = here;
    hereK = nextK;
    here = after;
  }
  return found;
}

/** How far, in metres per radian-per-metre, a rider cuts to the inside of a bend, and at most. */
const APEX_PULL = 180;
const APEX_MOST = 1;
/** A rider stays this far inside the road's edge, out of the gutter. */
const EDGE = 0.9;

/**
 * Where a rider in `lane` (metres right of the centre line) rides through the bend at `s` on a road
 * `half` wide each side: drawn to the inside towards the apex, as racers take the racing line,
 * and never into the gutter.
 */
export function racingLine(world: World, s: number, lane: number, half: number): number {
  const pull = Math.min(Math.max(curvature(world, s) * APEX_PULL, -APEX_MOST), APEX_MOST);
  return Math.min(Math.max(lane + pull, -half + EDGE), half - EDGE);
}

/**
 * The road `m` metres ahead of the rider at `s`, as samples of four: the centre (x, z), the heading
 * in radians turned from the heading under the rider, and the curvature per metre.
 */
export function bendAhead(world: World, s: number, out?: Float32Array): Float32Array {
  const under = heading(world, s);
  const end = heading(world, s + ROAD_END) - under;
  const turn = (m: number): number => {
    if (m <= ROAD_END) return ((heading(world, s + m) - under) * Math.PI) / 180;
    const u = Math.min((m - ROAD_END) / (FADE_END - ROAD_END), 1);
    return (end * (1 - u * u * (3 - 2 * u)) * Math.PI) / 180;
  };
  const samples = out ?? new Float32Array(BEND_SAMPLES * 4);
  const rider = -BEND_FROM / BEND_STEP;
  BEND_X[rider] = 0;
  BEND_Z[rider] = 0;
  for (let i = rider + 1; i < BEND_SAMPLES; i++) {
    const phi = turn(BEND_FROM + i * BEND_STEP - BEND_STEP / 2);
    BEND_X[i] = BEND_X[i - 1]! + BEND_STEP * Math.sin(phi);
    BEND_Z[i] = BEND_Z[i - 1]! - BEND_STEP * Math.cos(phi);
  }
  for (let i = rider - 1; i >= 0; i--) {
    const phi = turn(BEND_FROM + i * BEND_STEP + BEND_STEP / 2);
    BEND_X[i] = BEND_X[i + 1]! - BEND_STEP * Math.sin(phi);
    BEND_Z[i] = BEND_Z[i + 1]! + BEND_STEP * Math.cos(phi);
  }
  for (let i = 0; i < BEND_SAMPLES; i++) {
    const m = BEND_FROM + i * BEND_STEP;
    BEND_CURV[i] = turn(m + 0.5) - turn(m - 0.5);
  }
  for (let i = 0; i < BEND_SAMPLES; i++) {
    const base = i * 4;
    samples[base] = BEND_X[i]!;
    samples[base + 1] = BEND_Z[i]!;
    samples[base + 2] = turn(BEND_FROM + i * BEND_STEP);
    // The tightest curvature within 8 m, so the easing inside a bend allows for a tightening one.
    let tightest = 0;
    const jFrom = Math.max(i - 2, 0);
    const jTo = Math.min(i + 2, BEND_SAMPLES - 1);
    for (let j = jFrom; j <= jTo; j++) {
      const ak = Math.abs(BEND_CURV[j]!);
      if (ak > tightest) tightest = ak;
    }
    samples[base + 3] = Math.sign(BEND_CURV[i]!) * tightest;
  }
  return samples;
}

/** Where a point of the straight road, `x` across and `z` along it, lies on the bending one. */
export function bendPoint(samples: Float32Array, x: number, z: number): BendPoint {
  const m = -z;
  const f = Math.min(Math.max((m - BEND_FROM) / BEND_STEP, 0), BEND_SAMPLES - 1);
  const i = Math.min(Math.floor(f), BEND_SAMPLES - 2);
  const t = f - i;
  const base = i * 4;
  const next = base + 4;
  const cx = samples[base]! + (samples[next]! - samples[base]!) * t;
  const cz = samples[base + 1]! + (samples[next + 1]! - samples[base + 1]!) * t;
  const phi = samples[base + 2]! + (samples[next + 2]! - samples[base + 2]!) * t;
  const k = samples[base + 3]! + (samples[next + 3]! - samples[base + 3]!) * t;
  const dm = m - (BEND_FROM + f * BEND_STEP);
  // The right-hand normal and the way ahead.
  const nx = Math.cos(phi);
  const nz = Math.sin(phi);
  const tx = Math.sin(phi);
  const tz = -Math.cos(phi);
  // On the inside of a bend, ease towards its centre, so nothing folds back over the road.
  const across = eased(x, k);
  return { x: cx + across * nx + dm * tx, z: cz + across * nz + dm * tz };
}

/**
 * How much of its height above the road a point `x` across keeps on a bend of curvature `k`: as
 * much as the ease keeps of its distance across there, the slope of `eased`. Squeezed across but
 * not down, a fellside on the inside of a hairpin would stand up as a sheer wall; squeezed both
 * ways, it keeps its shape, only smaller.
 */
export function squeeze(x: number, k: number): number {
  const ak = Math.abs(k);
  const inside = x * Math.sign(k);
  const from = EASE_FROM / ak;
  if (ak <= MIN_CURVATURE || inside <= from) return 1;
  const room = (EASE_TO - EASE_FROM) / ak;
  return Math.exp(-(inside - from) / room);
}

/** `x` across the road, eased on the inside of a bend of curvature `k` towards its centre. */
function eased(x: number, k: number): number {
  const ak = Math.abs(k);
  const inside = x * Math.sign(k);
  const from = EASE_FROM / ak;
  if (ak <= MIN_CURVATURE || inside <= from) return x;
  const room = (EASE_TO - EASE_FROM) / ak;
  return Math.sign(k) * (from + room * (1 - Math.exp(-(inside - from) / room)));
}

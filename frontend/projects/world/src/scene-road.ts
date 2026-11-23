// The road ahead of the rider and its arch, laid from the plan (L2-110 AC1, AC2).
import type { TimedSegment as Segment } from '@telo/api';
import { targetGrade, type World } from './worlds';

/** The slowest speed the road is laid at, so a stopped rider still sees what is coming. */
export const MIN_SPEED = 3;
const STEP = 2;
/** The profile eases 0.12 of the way per second (L2-101 AC3). */
export const EASE_PER_SECOND = 0.12;

export interface Arch {
  readonly label: string;
  /** Metres ahead of the rider. */
  readonly metres: number;
}

export interface RoadPoint {
  /** Metres ahead of the rider. */
  readonly metres: number;
  /** Metres above the rider. */
  readonly height: number;
  /** Gradient, in percent. */
  readonly grade: number;
}

export interface MutableRoadPoint {
  metres: number;
  height: number;
  grade: number;
}

export interface RoadStart {
  /** The ride's `elapsed_seconds`. */
  readonly t: number;
  /** Metres ridden. */
  readonly s: number;
  /** m/s. */
  readonly speed: number;
  /** The gradient under the rider, in percent. */
  readonly grade: number;
}

function indexAt(segments: readonly Segment[], t: number): number {
  const i = segments.findIndex((s) => t >= s.start && t < s.start + s.duration);
  return i < 0 ? segments.length - 1 : i;
}

/** The arch ahead: the effort name before a `work` segment, `Finish` on the last one. */
export function nextArch(
  world: World,
  segments: readonly Segment[],
  t: number,
  speed: number,
): Arch | null {
  const i = indexAt(segments, t);
  const current = segments[i];
  if (!current) return null;
  const v = Math.max(speed, MIN_SPEED);
  const next = segments[i + 1];
  if (next) {
    return next.kind === 'work' ? { label: world.effortName, metres: (next.start - t) * v } : null;
  }
  return { label: 'Finish', metres: (current.start + current.duration - t) * v };
}

function writeRoadPoint(
  out: MutableRoadPoint[],
  index: number,
  metres: number,
  height: number,
  grade: number,
): void {
  const existing = out[index];
  if (existing) {
    existing.metres = metres;
    existing.height = height;
    existing.grade = grade;
  } else {
    out[index] = { metres, height, grade };
  }
}

/** The road in 2 m steps ahead: each step eases towards the grade of the segment it falls in. */
export function roadAhead(
  world: World,
  segments: readonly Segment[],
  start: RoadStart,
  steps: number,
  out?: MutableRoadPoint[],
): RoadPoint[] {
  const v = Math.max(start.speed, MIN_SPEED);
  const ease = 1 - Math.pow(1 - EASE_PER_SECOND, STEP / v);
  const road: MutableRoadPoint[] = out ?? [];
  road.length = steps + 1;
  writeRoadPoint(road, 0, 0, 0, start.grade);
  let g = start.grade;
  let height = 0;
  let segIdx = segments.length > 0 ? indexAt(segments, start.t) : -1;
  for (let i = 1; i <= steps; i++) {
    const metres = i * STEP;
    const at = start.t + metres / v;
    if (segIdx >= 0) {
      while (segIdx + 1 < segments.length) {
        const cur = segments[segIdx]!;
        if (at < cur.start + cur.duration) break;
        segIdx++;
      }
      const cur = segments[segIdx]!;
      const seg = at >= cur.start && at < cur.start + cur.duration ? cur : segments.at(-1);
      if (seg) g += ease * (targetGrade(world, seg.kind, start.s + metres) - g);
    }
    height += (g / 100) * STEP;
    writeRoadPoint(road, i, metres, height, g);
  }
  return road;
}

/** A ramp begins where the gradient rises through this, in percent. */
export const RAMP_FROM = 3;
/** The sign gives the steepest gradient within this many metres of the ramp's foot. */
const RAMP_READ = 150;

/** The foot of the first ramp ahead, and its steepest gradient in whole percent. */
export function nextRamp(points: readonly RoadPoint[]): { metres: number; grade: number } | null {
  for (let i = 1; i < points.length; i++) {
    const before = points[i - 1]!;
    const here = points[i]!;
    if (before.grade < RAMP_FROM && here.grade >= RAMP_FROM) {
      let steepest = here.grade;
      for (let j = i; j < points.length && points[j]!.metres - here.metres <= RAMP_READ; j++) {
        steepest = Math.max(steepest, points[j]!.grade);
      }
      return { metres: here.metres, grade: Math.round(steepest) };
    }
  }
  return null;
}

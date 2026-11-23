import { RIDE_KINDS, type TraceSegment } from './ride-kind';

/** The trace's height in its own units; its width is the plan's length in seconds. */
export const TRACE_HEIGHT = 600;

/** One segment's target as the trace draws it: a faint block up to the target and the target's line on top. */
export interface TraceBlock {
  readonly modifier: string;
  readonly x: number;
  readonly width: number;
  readonly y: number;
  readonly past: boolean;
}

const yOf = (watts: number, max: number) =>
  TRACE_HEIGHT - (Math.min(Math.max(watts, 0), max) / max) * TRACE_HEIGHT;

/** The plan's target blocks, with a gap of 2 between them, those already ridden marked past. */
export function traceBlocks(
  segments: readonly TraceSegment[],
  max: number,
  elapsed: number,
): TraceBlock[] {
  let start = 0;
  return segments.map((segment) => {
    const block = {
      modifier: RIDE_KINDS[segment.kind].modifier,
      x: start + 2,
      width: Math.max(segment.duration - 4, 1),
      y: yOf(segment.target, max),
      past: start + segment.duration <= elapsed,
    };
    start += segment.duration;
    return block;
  });
}

/** The rider's power as a polyline's points, one at the middle of each bucket of seconds. */
export function tracePoints(averages: readonly number[], bucket: number, max: number): string {
  return averages
    .map((watts, i) => `${i * bucket + bucket / 2},${round(yOf(watts, max))}`)
    .join(' ');
}

/** The area under the rider's power, closed along the bottom; empty before the first second. */
export function traceArea(averages: readonly number[], bucket: number, max: number): string {
  if (averages.length === 0) return '';
  const first = bucket / 2;
  const last = (averages.length - 1) * bucket + bucket / 2;
  return `M${first},${TRACE_HEIGHT} L${tracePoints(averages, bucket, max).replaceAll(' ', ' L')} L${last},${TRACE_HEIGHT} Z`;
}

/** A time tick of the ride: its words, where it sits across the width (0 to 100) and how its text is anchored. */
export interface RideTick {
  readonly text: string;
  readonly at: number;
  readonly anchor: 'start' | 'middle' | 'end';
}

/** A tick every 5:00 from 0:00, every 15:00 past an hour, and one at the end (L2-103 AC4). */
export function rideTicks(total: number, clock: (seconds: number) => string): RideTick[] {
  const step = total > 3600 ? 900 : 300;
  const ticks: RideTick[] = [];
  for (let at = 0; at < total; at += step) {
    ticks.push({ text: clock(at), at: (at / total) * 100, anchor: at === 0 ? 'start' : 'middle' });
  }
  ticks.push({ text: clock(total), at: 100, anchor: 'end' });
  return ticks;
}

const round = (value: number) => Math.round(value * 100) / 100;

// `main`'s scene reads each segment's start second, which Telo Ride's plan leaves to its order (ADR 0030).
import type { Segment, TimedSegment } from '@telo/api';

/** The plan's segments, each with the second it starts at, from 0:00 in order. */
export function timedSegments(segments: readonly Segment[]): TimedSegment[] {
  let start = 0;
  return segments.map((segment) => {
    const timed = { ...segment, start };
    start += segment.duration;
    return timed;
  });
}

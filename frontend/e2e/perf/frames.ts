/** What a run of frames measured: its average rate, and the longest stretch of frames slower than 30 a second. */
export interface FrameRun {
  readonly averageFps: number;
  readonly longestBelow30Ms: number;
}

/** Below 30 frames a second, a frame takes longer than this. */
const SLOW_FRAME_MS = 1000 / 30;

/** Reads a run of frame intervals in milliseconds, as `requestAnimationFrame` saw them. */
export function frameRun(intervals: readonly number[]): FrameRun {
  const total = intervals.reduce((sum, ms) => sum + ms, 0);
  let longest = 0;
  let stretch = 0;
  for (const ms of intervals) {
    stretch = ms > SLOW_FRAME_MS ? stretch + ms : 0;
    longest = Math.max(longest, stretch);
  }
  return {
    averageFps: total === 0 ? 0 : (intervals.length * 1000) / total,
    longestBelow30Ms: longest,
  };
}

// The display's frame period, measured from requestAnimationFrame intervals (L2-111 AC9).
// Pure: FrameScheduler collects the intervals and World Ride judges its frames against the result.

/** The refresh rates displays commonly run at, in hertz. */
const RATES = [30, 48, 50, 60, 75, 90, 120, 144, 165, 240] as const;
/** An interval longer than this is a hitch or a hidden tab, not a refresh. */
const GAP_MS = 100;
/** Fewer usable intervals than this say too little to trust. */
const MIN_SAMPLES = 10;
const FALLBACK_MS = 1000 / 60;

/**
 * The frame period in ms: the median interval, leaving out the first and any over 100 ms,
 * snapped to the nearest common refresh rate; 60 Hz with fewer than 10 usable intervals.
 */
export function estimateFramePeriod(intervals: readonly number[]): number {
  const usable = intervals
    .slice(1)
    .filter((ms) => ms > 0 && ms <= GAP_MS)
    .sort((a, b) => a - b);
  if (usable.length < MIN_SAMPLES) return FALLBACK_MS;
  const hz = 1000 / usable[Math.floor(usable.length / 2)]!;
  const nearest = RATES.reduce((best, rate) =>
    Math.abs(rate - hz) < Math.abs(best - hz) ? rate : best,
  );
  return 1000 / nearest;
}

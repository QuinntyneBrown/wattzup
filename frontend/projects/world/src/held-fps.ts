// The frame rate World loading's warm-up held (L2-152 AC5): built new for Telo Ride on `main`'s warm-up, which draws
// the scene over a few frames and rehearses the ride's first frame, each awaited through the frame callback.

/**
 * Frames a second from the times (ms) the warm-up's frames arrived: the median interval, so the frame a program
 * compiles in does not set the rate, rounded. `null` from fewer than two frames.
 */
export function heldFps(times: readonly number[]): number | null {
  const intervals = times
    .slice(1)
    .map((time, i) => time - times[i]!)
    .sort((a, b) => a - b);
  if (intervals.length === 0) return null;
  const middle = intervals.length >> 1;
  const median =
    intervals.length % 2 ? intervals[middle]! : (intervals[middle - 1]! + intervals[middle]!) / 2;
  return median > 0 ? Math.round(1000 / median) : null;
}

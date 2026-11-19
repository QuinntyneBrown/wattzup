// What the level picker's keys and taps choose (L2-020, L2-041): a pure helper for
// the slider, over the bike's levels 1–32.
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 32;

/** The values a picker offers; `start` is where a key press starts when nothing is set yet. */
export interface PickerRange {
  min: number;
  max: number;
  page: number;
  start: number;
}

/** Raise and Lower start at 12 when nothing is set yet; Page moves by 4. */
export const LEVEL_RANGE: PickerRange = { min: MIN_LEVEL, max: MAX_LEVEL, page: 4, start: 12 };

const clamp = (n: number, r: PickerRange): number => Math.min(r.max, Math.max(r.min, n));

/** The value a key moves to from `current`, or null for a key the slider does not handle. */
export function levelForKey(
  key: string,
  current: number | null,
  range: PickerRange = LEVEL_RANGE,
): number | null {
  const from = current ?? range.start;
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return clamp(from + 1, range);
    case 'ArrowLeft':
    case 'ArrowDown':
      return clamp(from - 1, range);
    case 'PageUp':
      return clamp(from + range.page, range);
    case 'PageDown':
      return clamp(from - range.page, range);
    case 'Home':
      return range.min;
    case 'End':
      return range.max;
    default:
      return null;
  }
}

/** The value under a tap `fraction` of the way across the bars (0 = left edge, 1 = right edge). */
export function levelAtFraction(fraction: number, range: PickerRange = LEVEL_RANGE): number {
  const bars = range.max - range.min + 1;
  return clamp(Math.floor(fraction * bars) + range.min, range);
}

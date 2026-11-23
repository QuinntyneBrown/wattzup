// Stage coaching & riding-feel helpers aligning Sella Ronda's terrain with GCN-style cadence & resistance intervals.

export type SellaRidingPhase =
  'valley-spin' | 'switchback-climb' | 'summit-crest' | 'alpine-descent';

/** Classifies `gradePercent` and proximity to a pass summit into one of the four Sella Ronda riding phases. */
export function classifySellaRidingPhase(
  gradePercent: number,
  metresToNearestPass: number,
): SellaRidingPhase {
  if (Math.abs(metresToNearestPass) <= 85) return 'summit-crest';
  if (gradePercent >= 3.2) return 'switchback-climb';
  if (gradePercent <= -2.8) return 'alpine-descent';
  return 'valley-spin';
}

/** Recommended rider posture (`'seated-spin' | 'out-of-saddle' | 'aero-tuck'`) for `gradePercent` and `cadenceAim`. */
export function recommendedRiderPosture(
  gradePercent: number,
  cadenceAim: number,
): 'seated-spin' | 'out-of-saddle' | 'aero-tuck' {
  if (gradePercent <= -4.0) return 'aero-tuck';
  if (gradePercent >= 6.5 && cadenceAim <= 76) return 'out-of-saddle';
  return 'seated-spin';
}

/** Normalized lap progress (0..1) along the 11,650 m Sella Ronda circuit. */
export function loopCompletionFraction(metres: number): number {
  return Math.max(0, Math.min(1, metres / 11650));
}

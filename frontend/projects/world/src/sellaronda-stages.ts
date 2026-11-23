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

/** Smooth 0..100 score rewarding riders for holding `actualRpm` close to the stage's `targetRpm`. */
export function cadenceComplianceScore(actualRpm: number, targetRpm: number): number {
  if (actualRpm <= 0 || targetRpm <= 0) return 0;
  const err = Math.abs(actualRpm - targetRpm);
  return Math.round(100 * Math.exp(-((err / 14) ** 2)));
}

/** Maps indoor bike `targetResistance` (1..32) onto Sella Ronda's visual road gradient (%). */
export function resistanceToRoadGradePercent(targetResistance: number): number {
  const clamped = Math.max(1, Math.min(32, targetResistance));
  return Number((((clamped - 14) / 18) * 11.5).toFixed(1));
}

/** Relative climb difficulty weight (1.0..1.6) for cresting `passId` on Sella Ronda. */
export function passDifficultyMultiplier(
  passId: 'campolongo' | 'pordoi' | 'sella' | 'gardena',
): number {
  switch (passId) {
    case 'campolongo':
      return 1.0;
    case 'gardena':
      return 1.3;
    case 'pordoi':
      return 1.45;
    case 'sella':
      return 1.55;
  }
}

/** Combined stage score multiplier (0..1.55) weighting cadence accuracy by Sella Ronda pass difficulty. */
export function stagePointsMultiplier(
  actualRpm: number,
  targetRpm: number,
  passId: 'campolongo' | 'pordoi' | 'sella' | 'gardena',
): number {
  const compliance = cadenceComplianceScore(actualRpm, targetRpm) / 100;
  return Number((compliance * passDifficultyMultiplier(passId)).toFixed(3));
}

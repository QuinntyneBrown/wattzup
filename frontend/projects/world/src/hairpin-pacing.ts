// Pure curvature classification for alpine switchback (tornante) riding cues.

export type BendKind = 'straight' | 'sweeper' | 'curve' | 'tornante';

/** Classifies a road curvature kappa (radians per metre) into an alpine bend category. */
export function classifyBendSeverity(curvaturePerMetre: number): BendKind {
  const k = Math.abs(curvaturePerMetre);
  if (k >= 1 / 65) return 'tornante';
  if (k >= 1 / 120) return 'curve';
  if (k >= 1 / 280) return 'sweeper';
  return 'straight';
}

/** Smooth cornering speed factor (0.55..1.0) for a given curvature kappa (rad/m) on mountain descents. */
export function apexSpeedFactor(curvaturePerMetre: number): number {
  const k = Math.abs(curvaturePerMetre);
  return Math.max(0.55, 1 / (1 + k * 24));
}

/** Suggested climbing/cornering cadence (rpm) given `gradePercent` and `curvaturePerMetre`. */
export function switchbackCadenceTargetRpm(
  gradePercent: number,
  curvaturePerMetre: number,
): number {
  const base = gradePercent >= 7 ? 78 : gradePercent >= 4 ? 85 : 92;
  const boost = classifyBendSeverity(curvaturePerMetre) === 'tornante' && gradePercent > 3 ? 6 : 0;
  return base + boost;
}

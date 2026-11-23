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

/** Equilibrium bicycle lean angle in degrees (`-28..28`) for `speedMps` and signed `curvaturePerMetre`. */
export function leanAngleDegrees(speedMps: number, curvaturePerMetre: number): number {
  const v = Math.max(0, speedMps);
  const raw = (Math.atan((v * v * curvaturePerMetre) / 9.81) * 180) / Math.PI;
  return Math.max(-28, Math.min(28, raw));
}

/** Stopping/slowing distance (m) from `entryMps` to `apexMps` on `gradePercent` (negative = downhill). */
export function brakingDistanceMetres(
  entryMps: number,
  apexMps: number,
  gradePercent: number,
): number {
  if (entryMps <= apexMps) return 0;
  const decelG = Math.max(0.18, 0.55 + gradePercent * 0.01);
  return (entryMps * entryMps - apexMps * apexMps) / (2 * 9.81 * decelG);
}

/** Turning radius in metres (`Infinity` on dead-straight road) for `curvaturePerMetre`. */
export function tornanteRadiusMetres(curvaturePerMetre: number): number {
  const k = Math.abs(curvaturePerMetre);
  return k < 1e-6 ? Number.POSITIVE_INFINITY : 1 / k;
}

/** Ratio of outer-line gradient to inner-apex gradient (< 1) around a switchback of `centreRadiusM` and `halfWidthM`. */
export function outerVsInnerHairpinGradeRatio(centreRadiusM: number, halfWidthM = 3.75): number {
  const r = Math.max(halfWidthM + 2, centreRadiusM);
  return (r - halfWidthM) / (r + halfWidthM);
}

/** Counts distinct tornante curvature peaks (`|k| > 1/78`) separated by at least `minSpacingSamples`. */
export function countTornantiInCurvatures(
  curvatures: readonly number[],
  minSpacingSamples = 18,
): number {
  let count = 0;
  let last = -minSpacingSamples;
  for (let i = 2; i < curvatures.length - 2; i++) {
    const ak = Math.abs(curvatures[i]!);
    if (
      ak > 1 / 78 &&
      ak >= Math.abs(curvatures[i - 2]!) &&
      ak >= Math.abs(curvatures[i + 2]!) &&
      i - last >= minSpacingSamples
    ) {
      count++;
      last = i;
    }
  }
  return count;
}

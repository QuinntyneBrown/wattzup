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

const GALLERIES: readonly (readonly [number, number])[] = [
  [4560, 4648], // Pordoi cliffside galleria paramassi
  [9660, 9740], // Gardena cliffside galleria paramassi
];

/** True when `metres` lies inside one of Sella Ronda's cliffside concrete rockfall galleries. */
export function isInsideRockfallGallery(metres: number): boolean {
  const w = ((metres % 11650) + 11650) % 11650;
  return GALLERIES.some(([a, b]) => w >= a && w <= b);
}

/** Lateral centripetal cornering load in g-units (`v^2 * |k| / 9.81`). */
export function centripetalGForce(speedMps: number, curvaturePerMetre: number): number {
  const v = Math.max(0, speedMps);
  return (v * v * Math.abs(curvaturePerMetre)) / 9.81;
}

/** Optimal road positioning strategy through a Dolomite switchback given `gradePercent`. */
export function recommendedHairpinLine(
  gradePercent: number,
  curvaturePerMetre: number,
): 'hold-lane' | 'wide-climbing-arc' | 'late-apex-descent' {
  if (classifyBendSeverity(curvaturePerMetre) !== 'tornante') return 'hold-lane';
  return gradePercent >= 0 ? 'wide-climbing-arc' : 'late-apex-descent';
}

/** Safe bicycle cornering speed ceiling (km/h, capped at 75 km/h) for `curvaturePerMetre` and tyre grip `mu`. */
export function maxSafeCornerSpeedKmh(curvaturePerMetre: number, mu = 0.65): number {
  const k = Math.abs(curvaturePerMetre);
  if (k < 1e-4) return 75;
  const vMps = Math.sqrt((Math.max(0.2, mu) * 9.81) / k);
  return Math.min(75, Number((vMps * 3.6).toFixed(1)));
}

/** Terminal aero-tuck coasting speed (km/h) on a negative `gradePercent` descent at 2,000 m air density. */
export function downhillTerminalCoastKmh(gradePercent: number, systemKg = 78, cda = 0.28): number {
  if (gradePercent >= -0.5) return 0;
  const slope = Math.abs(gradePercent) / 100;
  const netSlope = Math.max(0.002, slope - 0.0045);
  const rho = 0.98; // ~2,000 m Dolomite air density kg/m^3
  const vMps = Math.sqrt((2 * systemKg * 9.81 * netSlope) / (rho * Math.max(0.18, cda)));
  return Math.min(82, Number((vMps * 3.6).toFixed(1)));
}

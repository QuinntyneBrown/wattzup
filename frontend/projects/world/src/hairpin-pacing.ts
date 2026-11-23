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

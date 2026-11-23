// Pure catenary kinematics for aerial Dolomite cable cars and gondolas (Funivia Sass Pordoi, Dantercepies).
// Zero Three.js dependency so cableway trajectories and reduced-motion holds are unit-tested directly.

export interface CableSpan {
  readonly from: readonly [number, number, number];
  readonly to: readonly [number, number, number];
  /** Mid-span catenary sag in metres (downward along -Y in glTF axes). */
  readonly sag: number;
  /** Seconds for one full ascent-or-descent traverse. */
  readonly traverseSeconds: number;
  /** Dwell pause in seconds at each terminal station. */
  readonly dwellSeconds: number;
}

export interface CabinPose {
  x: number;
  y: number;
  z: number;
  /** Small longitudinal pitch sway at departure/arrival, in radians. */
  sway: number;
}

/** Places a reversible Funivia cabin along span at seconds of the ride's clock. */
export function gondolaPosition(
  span: CableSpan,
  seconds: number,
  phase = 0,
  reducedMotion = false,
  out: CabinPose = { x: 0, y: 0, z: 0, sway: 0 },
): CabinPose {
  const leg = Math.max(1, span.traverseSeconds);
  const dwell = Math.max(0, span.dwellSeconds);
  const halfCycle = leg + dwell;
  const cycle = halfCycle * 2;
  const clock = reducedMotion ? 0 : Math.max(0, seconds);
  const wrapped = (((clock + phase * cycle) % cycle) + cycle) % cycle;

  let raw: number;
  if (wrapped < leg) {
    raw = wrapped / leg;
  } else if (wrapped < halfCycle) {
    raw = 1;
  } else if (wrapped < halfCycle + leg) {
    raw = 1 - (wrapped - halfCycle) / leg;
  } else {
    raw = 0;
  }
  // Smoothstep acceleration & braking into the valley and cliff-top stations.
  const t = raw * raw * (3 - 2 * raw);
  const [x0, y0, z0] = span.from;
  const [x1, y1, z1] = span.to;
  out.x = x0 + (x1 - x0) * t;
  out.y = y0 + (y1 - y0) * t - span.sag * 4 * t * (1 - t);
  out.z = z0 + (z1 - z0) * t;
  out.sway = reducedMotion ? 0 : Math.sin(t * Math.PI) * Math.sin(clock * 1.6) * 0.025;
  return out;
}

/** Places a carrier on a continuously circulating monocable loop with half-gauge separation between up & down ropes. */
export function chairliftLoopPosition(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  gaugeHalfMetres: number,
  loopSeconds: number,
  seconds: number,
  phase = 0,
  reducedMotion = false,
): { x: number; y: number; z: number; ascending: boolean } {
  const period = Math.max(4, loopSeconds);
  const clock = reducedMotion ? 0 : Math.max(0, seconds);
  const u = (((clock / period + phase) % 1) + 1) % 1;
  const ascending = u < 0.5;
  const t = ascending ? u * 2 : (1 - u) * 2;
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const len = Math.max(1e-4, Math.hypot(dx, dz));
  const px = (-dz / len) * gaugeHalfMetres * (ascending ? 1 : -1);
  const pz = (dx / len) * gaugeHalfMetres * (ascending ? 1 : -1);
  return {
    x: from[0] + dx * t + px,
    y: from[1] + (to[1] - from[1]) * t,
    z: from[2] + dz * t + pz,
    ascending,
  };
}

/** Average inclination angle in degrees from lower station to upper station of `span`. */
export function cablewaySlopeDegrees(span: CableSpan): number {
  const dx = span.to[0] - span.from[0];
  const dy = span.to[1] - span.from[1];
  const dz = span.to[2] - span.from[2];
  const horiz = Math.max(1e-4, Math.hypot(dx, dz));
  return (Math.atan2(dy, horiz) * 180) / Math.PI;
}

/** Exact vertical coordinate at the midpoint (t = 0.5) of `span` after subtracting catenary sag. */
export function midSpanAltitudeMetres(span: CableSpan): number {
  return (span.from[1] + span.to[1]) * 0.5 - span.sag;
}

/** Approximate cable rope length (m) between lower and upper stations including parabolic `sag`. */
export function cableLineLengthMetres(span: CableSpan): number {
  const chord = Math.hypot(
    span.to[0] - span.from[0],
    span.to[1] - span.from[1],
    span.to[2] - span.from[2],
  );
  if (chord < 1e-3) return 0;
  return chord + (8 * span.sag * span.sag) / (3 * chord);
}

/** Peak mid-traverse vertical climb speed (m/s) of a cabin ascending `span`. */
export function cablewayVerticalSpeedMps(span: CableSpan): number {
  const dy = Math.abs(span.to[1] - span.from[1]);
  const t = Math.max(1, span.traverseSeconds);
  // Smoothstep derivative peaks at 1.5 at u = 0.5.
  return (1.5 * dy) / t;
}

/** Full round-trip cycle period in seconds (ascent + upper dwell + descent + lower dwell) for `span`. */
export function cablewayRoundTripSeconds(span: CableSpan): number {
  return 2 * (Math.max(1, span.traverseSeconds) + Math.max(0, span.dwellSeconds));
}

/** True when the reversible cabin on `span` is currently dwelling at either terminal at `seconds`. */
export function isCabinDocked(span: CableSpan, seconds: number, phaseOffset = 0): boolean {
  const travel = Math.max(1, span.traverseSeconds);
  const dwell = Math.max(0, span.dwellSeconds);
  if (dwell === 0) return false;
  const half = travel + dwell;
  const cycle = half * 2;
  const wrapped = (((seconds + phaseOffset * cycle) % cycle) + cycle) % cycle;
  const local = wrapped < half ? wrapped : wrapped - half;
  return local < dwell;
}

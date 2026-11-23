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

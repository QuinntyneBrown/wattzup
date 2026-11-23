// Pure figure-eight thermal soaring kinematics for alpine paragliders over Passo Sella, Pordoi & Gardena.
// Zero Three.js dependency; unit-tested directly.

export interface ThermalOrbit {
  readonly center: readonly [number, number, number];
  readonly radiusX: number;
  readonly radiusZ: number;
  readonly liftAmplitude: number;
  readonly periodSeconds: number;
}

export interface GliderPose {
  x: number;
  y: number;
  z: number;
  heading: number;
  /** Coordinated bank angle into the turn, in radians (clamped within +/- 28 deg). */
  bank: number;
}

/** Places a thermal-soaring paraglider along a lazy Lissajous figure-eight orbit at seconds. */
export function paragliderPose(
  orbit: ThermalOrbit,
  seconds: number,
  phase = 0,
  reducedMotion = false,
  out: GliderPose = { x: 0, y: 0, z: 0, heading: 0, bank: 0 },
): GliderPose {
  const period = Math.max(8, orbit.periodSeconds);
  const w = (Math.PI * 2) / period;
  const t = (reducedMotion ? 0 : seconds) * w + phase * Math.PI * 2;
  const [cx, cy, cz] = orbit.center;

  out.x = cx + Math.cos(t) * orbit.radiusX;
  out.z = cz + Math.sin(2 * t) * (orbit.radiusZ * 0.5);
  out.y = cy + Math.sin(t * 0.5) * orbit.liftAmplitude;

  const vx = -Math.sin(t) * orbit.radiusX * w;
  const vz = Math.cos(2 * t) * orbit.radiusZ * w;
  out.heading = Math.atan2(-vx, -vz);

  if (reducedMotion) {
    out.bank = 0;
  } else {
    const ax = -Math.cos(t) * orbit.radiusX * w * w;
    const az = -2 * Math.sin(2 * t) * orbit.radiusZ * w * w;
    const speedSq = Math.max(1e-3, vx * vx + vz * vz);
    const signedCurv = (vx * az - vz * ax) / Math.pow(speedSq, 1.5);
    const speed = Math.sqrt(speedSq);
    const rawBank = Math.atan((speed * speed * signedCurv) / 9.81);
    out.bank = Math.max(-0.48, Math.min(0.48, rawBank));
  }
  return out;
}

/** Instantaneous horizontal ground speed (m/s) of a paraglider along `orbit` at `seconds`. */
export function paragliderGroundSpeedMps(orbit: ThermalOrbit, seconds: number, phase = 0): number {
  const period = Math.max(8, orbit.periodSeconds);
  const w = (Math.PI * 2) / period;
  const t = seconds * w + phase * Math.PI * 2;
  const vx = -Math.sin(t) * orbit.radiusX * w;
  const vz = Math.cos(2 * t) * orbit.radiusZ * w;
  return Math.hypot(vx, vz);
}

// Speed-by-gradient model for recreational Sellaronda Bike Day riders on Dolomite passes.

/** Estimates steady Bike Day speed (km/h) on `gradePercent` (-12..+14 %) for a rider of `wattsPerKg`. */
export function bikeDayClimbSpeedKmh(gradePercent: number, wattsPerKg = 3.0): number {
  const clampedWkg = Math.max(1.2, Math.min(6.5, wattsPerKg));
  if (gradePercent <= -3) {
    return Math.min(62, 38 + Math.abs(gradePercent + 3) * 3.2);
  }
  if (gradePercent < 1) {
    return 28 + (1 - gradePercent) * 2.2 * (clampedWkg / 3.0);
  }
  // Gravity-dominated alpine climb speed: V (m/s) ~= W/kg / (9.81 * (grade + Crr)).
  const slope = gradePercent / 100 + 0.005;
  const mps = (clampedWkg * 0.86) / (9.81 * slope);
  return Math.max(7.5, Math.min(34, mps * 3.6));
}

/** Aerodynamic power saving percentage (0..32 %) when drafting `gapMetres` behind a cyclist ahead. */
export function pelotonDraftSavingPercent(gapMetres: number): number {
  if (gapMetres <= 0 || gapMetres >= 12) return 0;
  const clamped = Math.max(0.4, gapMetres);
  return 32 * Math.exp(-(clamped - 0.4) / 3.2);
}

/** Steady-state spatial density of Bike Day riders (riders/km) given constant flow `ridersPerHour` and `gradePercent`. */
export function bikeDayRidersPerKm(
  ridersPerHour: number,
  gradePercent: number,
  riderWatts = 210,
): number {
  if (ridersPerHour <= 0) return 0;
  const speedKmh = bikeDayClimbSpeedKmh(gradePercent, riderWatts);
  return ridersPerHour / Math.max(5, speedKmh);
}

/** Estimated climb time in minutes over `lengthKm` at `gradePercent` for a rider sustaining `riderWatts`. */
export function passClimbMinutesEstimate(
  lengthKm: number,
  gradePercent: number,
  riderWatts: number,
  systemKg = 78,
): number {
  if (lengthKm <= 0) return 0;
  const speedKmh = bikeDayClimbSpeedKmh(gradePercent, riderWatts / Math.max(40, systemKg));
  return (lengthKm / speedKmh) * 60;
}

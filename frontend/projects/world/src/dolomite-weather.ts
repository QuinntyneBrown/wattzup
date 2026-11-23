// Alpine meteorological helpers for Sella Ronda passes (1,465 m Val di Fassa -> 2,240 m Passo Sella).

/** Estimates alpine air temperature (°C) at `altitudeMetres` given Corvara (1,568 m) baseline temperature. */
export function passAirTemperatureCelsius(altitudeMetres: number, corvaraTempC = 18.0): number {
  const lapsePerMetre = 0.0065;
  return Number((corvaraTempC - (altitudeMetres - 1568) * lapsePerMetre).toFixed(1));
}

/** Relative barometric air density ratio (0..1 vs sea level) at `altitudeMetres` using the barometric formula. */
export function relativeAirDensity(altitudeMetres: number): number {
  const h = Math.max(0, altitudeMetres);
  return Math.pow(1 - 2.25577e-5 * h, 4.25588);
}

/** Perceived wind-chill temperature (°C) for `airTempC` and relative airflow `speedKmh` on fast pass descents. */
export function windChillCelsius(airTempC: number, speedKmh: number): number {
  if (airTempC > 14 || speedKmh < 5) return airTempC;
  const v16 = Math.pow(speedKmh, 0.16);
  return Number((13.12 + 0.6215 * airTempC - 11.37 * v16 + 0.3965 * airTempC * v16).toFixed(1));
}

/** Relative sustainable aerobic threshold power factor (0..1 vs sea level) for acclimatized cyclists at `altitudeMetres`. */
export function aerobicMaxPowerFactor(altitudeMetres: number): number {
  const km = Math.max(0, altitudeMetres) / 1000;
  // Bassett et al. acclimatized cycling power curve: ~91-93% at 2,240 m.
  return Math.max(0.5, 1 - 0.018 * km - 0.0085 * km * km);
}

/** Water boiling point (°C) at `altitudeMetres` (~92.5 °C on Passo Sella & Passo Pordoi). */
export function boilingPointCelsiusAtAltitude(altitudeMetres: number): number {
  return Number((100 - Math.max(0, altitudeMetres) * 0.00335).toFixed(1));
}

/** Clear-sky Alpine UV index at `altitudeMetres` (~11% increase per 1,000 m over `seaLevelUv`). */
export function uvIndexAtAltitude(altitudeMetres: number, seaLevelUv = 7.0): number {
  const factor = 1 + (Math.max(0, altitudeMetres) / 1000) * 0.11;
  return Number((seaLevelUv * factor).toFixed(1));
}

/** Recommended descent layering (`'summer-jersey' | 'wind-gilet' | 'thermal-jacket'`) for `summitTempC`. */
export function recommendedDescentLayer(
  summitTempC: number,
): 'summer-jersey' | 'wind-gilet' | 'thermal-jacket' {
  if (summitTempC < 8) return 'thermal-jacket';
  if (summitTempC < 16) return 'wind-gilet';
  return 'summer-jersey';
}

/** Standard atmospheric pressure (hPa) at `altitudeMetres` for barometric cycling computers. */
export function barometricHectopascals(altitudeMetres: number): number {
  const h = Math.max(0, altitudeMetres);
  return Math.round(1013.25 * Math.pow(1 - 2.25577e-5 * h, 5.25588));
}

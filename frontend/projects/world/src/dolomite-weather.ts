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

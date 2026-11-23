import { describe, expect, it } from 'vitest';
import { passAirTemperatureCelsius, relativeAirDensity } from './dolomite-weather';

describe('dolomite-weather', () => {
  it('cools air by ~4.4 °C from Corvara (1,568 m) up to Passo Sella (2,240 m)', () => {
    expect(passAirTemperatureCelsius(1568, 18)).toBe(18);
    expect(passAirTemperatureCelsius(2240, 18)).toBeCloseTo(13.6, 1);
  });

  it('reduces aerodynamic air density at 2,240 m to ~79% of sea level', () => {
    const rho = relativeAirDensity(2240);
    expect(rho).toBeGreaterThan(0.75);
    expect(rho).toBeLessThan(0.83);
  });
});

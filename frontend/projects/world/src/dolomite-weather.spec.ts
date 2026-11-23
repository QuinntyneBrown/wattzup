import { describe, expect, it } from 'vitest';
import {
  aerobicMaxPowerFactor,
  airDensityDragSavingPercent,
  barometricHectopascals,
  boilingPointCelsiusAtAltitude,
  passAirTemperatureCelsius,
  recommendedDescentLayer,
  relativeAirDensity,
  uvIndexAtAltitude,
  windChillCelsius,
} from './dolomite-weather';

describe('dolomite-weather', () => {
  it('cools air by ~4.4 °C from Corvara (1,568 m) up to Passo Sella (2,240 m)', () => {
    expect(passAirTemperatureCelsius(1568, 18)).toBe(18);
    expect(passAirTemperatureCelsius(2240, 18)).toBeCloseTo(13.6, 1);
  });

  it('reduces aerodynamic air density at 2,240 m to ~79% of sea level', () => {
    const rho = relativeAirDensity(2240);
    expect(rho).toBeGreaterThan(0.75);
    expect(rho).toBeLessThan(0.83);
    expect(windChillCelsius(10, 55)).toBeLessThan(8);
    expect(windChillCelsius(20, 40)).toBe(20);
    expect(aerobicMaxPowerFactor(0)).toBe(1);
    expect(aerobicMaxPowerFactor(2240)).toBeLessThan(0.94);
    expect(aerobicMaxPowerFactor(2240)).toBeGreaterThan(0.89);
    expect(boilingPointCelsiusAtAltitude(2240)).toBeCloseTo(92.5, 1);
    expect(uvIndexAtAltitude(2240, 7)).toBeGreaterThan(8.5);
    expect(recommendedDescentLayer(13)).toBe('wind-gilet');
    expect(recommendedDescentLayer(5)).toBe('thermal-jacket');
    expect(barometricHectopascals(0)).toBe(1013);
    expect(barometricHectopascals(2240)).toBeLessThan(785);
    expect(airDensityDragSavingPercent(2240)).toBeGreaterThan(18);
  });
});

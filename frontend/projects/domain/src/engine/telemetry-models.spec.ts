// Unit test (the slice's acceptance table: no screen shows telemetry until slice 3.2)
// Traces to: L2-022 AC1; L2-023 AC1 to AC3; L2-059 AC2
// Description: the Echelon reports neither speed nor power, so they are estimated from cadence and resistance by the
// fixed formulas of ADR 0003, rounding half to even. One case per row of the requirements.
import { bankersRound } from './bankers-round';
import { PowerModel } from './power-model';
import { SpeedModel } from './speed-model';

describe('bankersRound', () => {
  it.each([
    [2.5, 0, 2],
    [3.5, 0, 4],
    [-2.5, 0, -2],
    [0.25, 1, 0.2],
    [0.35, 1, 0.4],
    [29.9980976, 1, 30],
    [317.3, 0, 317],
    [317.7, 0, 318],
  ])('rounds %d to %d digits as %d, half to even', (value, digits, rounded) => {
    expect(bankersRound(value, digits)).toBe(rounded);
  });
});

describe('SpeedModel', () => {
  it('gives round(80 × 0.37497622, 1) = 30.0 km/h at 80 rpm (L2-022 AC1)', () => {
    expect(SpeedModel.speedKmh(80)).toBe(30);
  });

  it.each([
    [0, 0],
    [95, 35.6],
    [120, 45],
  ])('gives %d rpm as %d km/h', (cadence, kmh) => {
    expect(SpeedModel.speedKmh(cadence)).toBe(kmh);
  });
});

describe('PowerModel', () => {
  it('estimates max(0, round(95 × (0.55 + 18 × 0.155))) = 317 W at cadence 95, resistance 18 (L2-023 AC1)', () => {
    expect(PowerModel.estimate(95, 18)).toBe(317);
  });

  it.each([
    ['cadence', null, 18],
    ['resistance', 95, null],
    ['both', null, null],
  ])('is unknown when %s is unknown (L2-023 AC2)', (_, cadence, level) => {
    expect(PowerModel.estimate(cadence, level)).toBeNull();
  });

  it('estimates 0 W when the rider is not pedalling', () => {
    expect(PowerModel.estimate(0, 18)).toBe(0);
  });

  it('gives a segment with cadence aim 100 and level 18 a target power of 334 W (L2-023 AC3)', () => {
    expect(PowerModel.target(100, 18)).toBe(334);
  });

  it.each([
    [108, 107, true],
    [418, 418, true],
    [377, 418, true],
    [376, 418, false],
    [459, 418, true],
    [460, 418, false],
    [371, 418, false],
  ])('reads %d W against a target of %d W as on target: %s (L2-059 AC2)', (power, target, on) => {
    expect(PowerModel.onTarget(power, target)).toBe(on);
  });
});

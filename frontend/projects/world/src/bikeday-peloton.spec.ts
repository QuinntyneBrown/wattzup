import { describe, expect, it } from 'vitest';
import {
  bikeDayClimbSpeedKmh,
  bikeDayRidersPerKm,
  passClimbMinutesEstimate,
  pelotonDraftSavingPercent,
  vamMetresPerHour,
} from './bikeday-peloton';

describe('bikeDayClimbSpeedKmh', () => {
  it('climbs slower on 8 % Dolomite ramps than on 4 % gradients and sweeps briskly downhill', () => {
    const gentle = bikeDayClimbSpeedKmh(4, 3.2);
    const steep = bikeDayClimbSpeedKmh(8, 3.2);
    const descent = bikeDayClimbSpeedKmh(-6, 3.2);
    expect(steep).toBeLessThan(gentle);
    expect(descent).toBeGreaterThan(45);
    expect(pelotonDraftSavingPercent(1)).toBeGreaterThan(20);
    expect(pelotonDraftSavingPercent(15)).toBe(0);
    expect(bikeDayRidersPerKm(1200, 8)).toBeGreaterThan(bikeDayRidersPerKm(1200, -6));
    expect(passClimbMinutesEstimate(9.4, 6.8, 220)).toBeGreaterThan(30);
    expect(passClimbMinutesEstimate(9.4, 6.8, 360)).toBeLessThan(
      passClimbMinutesEstimate(9.4, 6.8, 220),
    );
    expect(vamMetresPerHour(7.5, 300)).toBeGreaterThan(950);
    expect(vamMetresPerHour(-5, 250)).toBe(0);
  });
});

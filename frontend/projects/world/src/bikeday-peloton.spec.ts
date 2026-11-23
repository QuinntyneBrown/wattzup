import { describe, expect, it } from 'vitest';
import {
  bikeDayClimbSpeedKmh,
  bikeDayRidersPerKm,
  pelotonDraftSavingPercent,
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
  });
});

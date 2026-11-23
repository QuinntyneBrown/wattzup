import { describe, expect, it } from 'vitest';
import { bikeDayClimbSpeedKmh } from './bikeday-peloton';

describe('bikeDayClimbSpeedKmh', () => {
  it('climbs slower on 8 % Dolomite ramps than on 4 % gradients and sweeps briskly downhill', () => {
    const gentle = bikeDayClimbSpeedKmh(4, 3.2);
    const steep = bikeDayClimbSpeedKmh(8, 3.2);
    const descent = bikeDayClimbSpeedKmh(-6, 3.2);
    expect(steep).toBeLessThan(gentle);
    expect(descent).toBeGreaterThan(45);
  });
});

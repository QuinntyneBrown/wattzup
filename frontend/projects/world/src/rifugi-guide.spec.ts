import { describe, expect, it } from 'vitest';
import { nearestRifugio, SELLA_RIFUGI } from './rifugi-guide';

describe('SELLA_RIFUGI', () => {
  it('covers all four passes with two historic rifugi each', () => {
    expect(SELLA_RIFUGI).toHaveLength(8);
    expect(nearestRifugio(4920).name).toBe('Hotel Savoia');
    expect(nearestRifugio(10125).name).toBe('Rifugio Frara');
  });
});

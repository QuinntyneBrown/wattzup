import { describe, expect, it } from 'vitest';
import { DOLOMITE_GIANTS, dominantPeakAt } from './dolomite-peaks';

describe('DOLOMITE_GIANTS', () => {
  it('names Marmolada (3,343 m) at Passo Pordoi with its glacier and Sassolungo (3,181 m) at Passo Sella', () => {
    expect(DOLOMITE_GIANTS.find((p) => p.hasGlacier)?.id).toBe('marmolada');
    expect(dominantPeakAt(4950).id).toBe('marmolada');
    expect(dominantPeakAt(7750).id).toBe('sassolungo');
  });
});

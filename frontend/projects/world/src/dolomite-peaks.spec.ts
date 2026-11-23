import { describe, expect, it } from 'vitest';
import {
  DOLOMITE_GIANTS,
  dominantPeakAt,
  marmoladaGlacierElevationBand,
  marmoladaGlacierSightline,
  peaksAboveThreeThousand,
  sassolungoSightline,
} from './dolomite-peaks';

describe('DOLOMITE_GIANTS', () => {
  it('names Marmolada (3,343 m) at Passo Pordoi with its glacier and Sassolungo (3,181 m) at Passo Sella', () => {
    expect(DOLOMITE_GIANTS.find((p) => p.hasGlacier)?.id).toBe('marmolada');
    expect(dominantPeakAt(4950).id).toBe('marmolada');
    expect(dominantPeakAt(7750).id).toBe('sassolungo');
    expect(marmoladaGlacierSightline(4950)).toBeCloseTo(1, 3);
    expect(marmoladaGlacierSightline(10150)).toBe(0);
    expect(sassolungoSightline(7750)).toBeCloseTo(1, 3);
    expect(sassolungoSightline(2100)).toBe(0);
    expect(peaksAboveThreeThousand()[0]?.id).toBe('marmolada');
    expect(
      marmoladaGlacierElevationBand().crestMetres - marmoladaGlacierElevationBand().snoutMetres,
    ).toBe(629);
  });
});

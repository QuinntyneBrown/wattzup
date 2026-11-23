import { describe, expect, it } from 'vitest';
import {
  angularElevationDegrees,
  DOLOMITE_GIANTS,
  dominantPeakAt,
  findDolomitePeak,
  horizonReliefMetres,
  isGlaciatedPeak,
  marmoladaGlacierElevationBand,
  marmoladaGlacierSightline,
  meanDolomiteGiantAltitude,
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
    expect(angularElevationDegrees(3181, 2240, 920)).toBeGreaterThan(44);
    expect(isGlaciatedPeak('marmolada')).toBe(true);
    expect(isGlaciatedPeak('sassolungo')).toBe(false);
    expect(horizonReliefMetres(DOLOMITE_GIANTS[2]!, 2240)).toBeGreaterThan(900);
    expect(findDolomitePeak('langkofel')?.id ?? findDolomitePeak('sassolungo')?.id).toBe(
      'sassolungo',
    );
    expect(findDolomitePeak('')).toBeNull();
    expect(meanDolomiteGiantAltitude()).toBeGreaterThan(2800);
  });
});

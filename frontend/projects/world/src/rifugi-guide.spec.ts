import { describe, expect, it } from 'vitest';
import {
  findRifugioByName,
  highestSellaRifugio,
  isNearPassRifugio,
  isSummitRifugioOpenAtHour,
  meanRifugioAltitudeMetres,
  nearestRifugio,
  nextRifugioAhead,
  rifugiCountByPass,
  rifugioElevationDropToNextValley,
  rifugiOnPass,
  rifugiOrderedAlongRide,
  rifugioSpecialtyDish,
  rifugioStopDurationMinutes,
  rifugiWithinMetres,
  SELLA_RIFUGI,
} from './rifugi-guide';

describe('SELLA_RIFUGI', () => {
  it('covers all four passes with two historic rifugi each', () => {
    expect(SELLA_RIFUGI).toHaveLength(8);
    expect(nearestRifugio(4920).name).toBe('Hotel Savoia');
    expect(nearestRifugio(10125).name).toBe('Rifugio Frara');
    expect(rifugiOnPass('sella').map((r) => r.name)).toEqual([
      'Passo Sella Dolomiti Mountain Resort',
      'Rifugio Maria Flora',
    ]);
    expect(highestSellaRifugio().name).toBe('Rifugio Maria Flora');
    expect(isNearPassRifugio(4930)).toBe(true);
    expect(isNearPassRifugio(3600)).toBe(false);
    expect(rifugioSpecialtyDish('gardena')).toContain('Kaiserschmarrn');
    expect(rifugiCountByPass().pordoi).toBeGreaterThanOrEqual(2);
    expect(nextRifugioAhead(3500).rifugio.passId).toBe('pordoi');
    const pordoiHut = rifugiOnPass('pordoi')[0]!;
    expect(rifugioElevationDropToNextValley(pordoiHut)).toBeGreaterThan(750);
    expect(isSummitRifugioOpenAtHour(18.5)).toBe(true);
    expect(isSummitRifugioOpenAtHour(2)).toBe(false);
    expect(rifugiWithinMetres(7750, 120).length).toBeGreaterThanOrEqual(2);
    expect(meanRifugioAltitudeMetres()).toBeGreaterThan(2000);
    expect(findRifugioByName('Savoia')?.passId).toBe('pordoi');
    expect(findRifugioByName('')).toBeNull();
    expect(rifugioStopDurationMinutes('espresso-strudel')).toBe(15);
    expect(rifugiOrderedAlongRide(4900)[0]?.passId).toBe('pordoi');
  });
});

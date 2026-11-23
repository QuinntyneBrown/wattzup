import { describe, expect, it } from 'vitest';
import {
  currentValley,
  distanceToNextVillage,
  hasOnionDomeBelfry,
  LADIN_VILLAGES,
  villageAtMetres,
} from './ladin-villages';

describe('LADIN_VILLAGES', () => {
  it('maps each inter-pass valley sector to Corvara, Arabba, Canazei, and Selva', () => {
    expect(LADIN_VILLAGES).toHaveLength(4);
    expect(currentValley(300).id).toBe('corvara');
    expect(currentValley(3120).id).toBe('arabba');
    expect(currentValley(6120).id).toBe('canazei');
    expect(currentValley(8920).id).toBe('selva');
    expect(currentValley(11100).id).toBe('corvara');
    const fromPordoi = distanceToNextVillage(4950);
    expect(fromPordoi.village.id).toBe('canazei');
    expect(fromPordoi.metresAhead).toBe(1170);
    expect(villageAtMetres(3100)?.id).toBe('arabba');
    expect(villageAtMetres(4950)).toBeNull();
    expect(hasOnionDomeBelfry('corvara')).toBe(true);
    expect(hasOnionDomeBelfry('arabba')).toBe(false);
  });
});

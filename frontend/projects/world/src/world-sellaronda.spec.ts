import { describe, expect, it } from 'vitest';
import { conceptsByCategory, SELLA_RONDA_CONCEPTS } from './world-sellaronda';

describe('SELLA_RONDA_CONCEPTS', () => {
  it('catalogues authentic Ladin architectural, road, and alpine concepts', () => {
    expect(SELLA_RONDA_CONCEPTS.length).toBeGreaterThanOrEqual(4);
    expect(conceptsByCategory('architecture').map((c) => c.id)).toEqual(['tabia', 'zwiebelturm']);
  });
});

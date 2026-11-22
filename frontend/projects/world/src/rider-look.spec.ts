import { riderLook } from './rider-look';

describe('what each rider looks like (L2-166 AC30)', () => {
  it('gives a rider the same look every time', () => {
    expect(riderLook(7)).toEqual(riderLook(7));
  });

  it('gives a pack of twelve several skin tones, hair colours, bikes and heights', () => {
    const pack = Array.from({ length: 12 }, (_, i) => riderLook(i + 1));
    for (const part of ['skin', 'hair', 'frame', 'shoe', 'scale'] as const) {
      expect(new Set(pack.map((look) => look[part])).size).toBeGreaterThanOrEqual(3);
    }
  });

  it('never gives two riders next to each other in the numbers the same skin, hair, bike and height', () => {
    for (let n = 1; n < 40; n++) {
      const a = riderLook(n);
      const b = riderLook(n + 1);
      expect([a.skin, a.hair, a.frame, a.scale]).not.toEqual([b.skin, b.hair, b.frame, b.scale]);
    }
  });

  it('keeps every rider within a height a bike of this size fits', () => {
    for (let n = 0; n < 60; n++) {
      expect(riderLook(n).scale).toBeGreaterThanOrEqual(0.94);
      expect(riderLook(n).scale).toBeLessThanOrEqual(1.06);
    }
  });
});

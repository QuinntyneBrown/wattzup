import { EDGE, edgeAmount, INK, RIM, toonRamp, toonShade } from './drawn-look';

describe('toonShade: diffuse light in three soft-edged bands (L2-111 AC11)', () => {
  // x is dot(N, L) mapped to 0..1, as three's toon lighting samples its ramp.
  it.each([
    ['facing away', 0.1, 0.35],
    ['just short of the first edge', 0.45, 0.35],
    ['side-lit', 0.62, 0.7],
    ['just short of the second edge', 0.74, 0.7],
    ['facing the light', 0.9, 1],
  ])('is a flat band when %s (x = %f)', (_, x, shade) => {
    expect(toonShade(x)).toBeCloseTo(shade, 9);
  });

  it.each([
    [0.5, (0.35 + 0.7) / 2],
    [0.78, (0.7 + 1) / 2],
  ])('is halfway between bands on the edge at x = %f', (x, shade) => {
    expect(toonShade(x)).toBeCloseTo(shade, 9);
  });

  it('never falls as the light comes round', () => {
    const shades = Array.from({ length: 101 }, (_, i) => toonShade(i / 100));
    for (let i = 1; i < shades.length; i++) {
      expect(shades[i]).toBeGreaterThanOrEqual(shades[i - 1]);
    }
  });
});

describe('toonRamp (L2-111 AC11)', () => {
  it('samples toonShade at the centre of each texel, in bytes', () => {
    const ramp = toonRamp(64);
    expect(ramp).toHaveLength(64);
    expect(ramp[0]).toBe(Math.round(0.35 * 255));
    expect(ramp[63]).toBe(255);
    expect(ramp[40]).toBe(Math.round(toonShade(40.5 / 64) * 255));
  });
});

describe('RIM', () => {
  it('lights the rim softly, sharpest at the silhouette', () => {
    expect(RIM.power).toBe(3);
    expect(RIM.strength).toBeGreaterThan(0);
    expect(RIM.strength).toBeLessThanOrEqual(0.5);
  });
});

describe('edgeAmount: where the ink outline falls (L2-111 AC11, technique 52)', () => {
  it.each([
    ['a flat wall', 0, 0, 0],
    ['a gentle curve', 0.01, 0.1, 0],
    ['a crease between faces', 0, 0.8, 1],
    ['a silhouette against the distance', 0.5, 0, 1],
    ['a step in depth just over the threshold', EDGE.depth + EDGE.soft, 0, 1],
    ['a turn of the normal just under the threshold', 0, EDGE.normal - EDGE.soft, 0],
  ])('is %s: depth jump %f, normal turn %f -> %f', (_, depthJump, normalTurn, amount) => {
    expect(edgeAmount(depthJump, normalTurn)).toBeCloseTo(amount, 9);
  });

  it('grows smoothly between none and full', () => {
    const mid = edgeAmount(EDGE.depth, 0);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
});

describe('INK', () => {
  it('outlines riders in a warmer ink than the scenery', () => {
    const warmth = (hex: number) => ((hex >> 16) & 0xff) - (hex & 0xff);
    expect(warmth(INK.riders)).toBeGreaterThan(warmth(INK.scenery));
  });
});

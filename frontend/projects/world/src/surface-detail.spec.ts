import { SURFACE_DETAIL_SIZE, surfaceDetail } from './surface-detail';

describe('surfaceDetail (L2-166 AC13)', () => {
  const size = SURFACE_DETAIL_SIZE;
  const texels = surfaceDetail();
  const at = (x: number, y: number, channel: number) => texels[(y * size + x) * 4 + channel]!;

  it('fills four channels of a square of texels', () => {
    expect(texels).toHaveLength(size * size * 4);
  });

  it('is the same on every device: nothing in it is random', () => {
    expect(surfaceDetail()).toEqual(texels);
  });

  it.each([
    [0, 'grain'],
    [1, 'patches'],
    [2, 'cracks'],
    [3, 'stones'],
  ])('varies in channel %i, the %s', (channel) => {
    let low = 255;
    let high = 0;
    for (let i = channel; i < texels.length; i += 4) {
      low = Math.min(low, texels[i]!);
      high = Math.max(high, texels[i]!);
    }
    expect(high - low).toBeGreaterThan(120);
  });

  it('repeats without a seam: the patches run on across each edge as smoothly as inside', () => {
    let inside = 0;
    let seam = 0;
    for (let i = 0; i < size; i++) {
      inside += Math.abs(at(size / 2, i, 1) - at(size / 2 - 1, i, 1));
      seam +=
        Math.abs(at(0, i, 1) - at(size - 1, i, 1)) + Math.abs(at(i, 0, 1) - at(i, size - 1, 1));
    }
    expect(seam / 2).toBeLessThan(inside * 2 + size);
  });

  it('keeps the cracks few: most of the road is unbroken', () => {
    let cracked = 0;
    for (let i = 2; i < texels.length; i += 4) if (texels[i]! > 128) cracked++;
    expect(cracked / (size * size)).toBeLessThan(0.12);
    expect(cracked).toBeGreaterThan(0);
  });
});

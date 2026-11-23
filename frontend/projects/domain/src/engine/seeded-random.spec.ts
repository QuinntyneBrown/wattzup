// Unit test
// Traces to: L2-067 AC1
// Description: the race's generator draws the same numbers from the same seed, in [0, 1), and the seed is the FNV-1a
// hash of the map and pack.
import { SeededRandom, fnv1a } from './seeded-random';

describe('SeededRandom', () => {
  const draws = (seed: number) => {
    const random = new SeededRandom(seed);
    return Array.from({ length: 5 }, () => random.next());
  };

  it('draws the same numbers from the same seed', () => {
    expect(draws(42)).toEqual(draws(42));
  });

  it('draws other numbers from another seed', () => {
    expect(draws(42)).not.toEqual(draws(43));
  });

  it('draws in [0, 1), and between gives [min, max)', () => {
    const random = new SeededRandom(7);
    for (let i = 0; i < 1000; i++) {
      const value = random.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      const between = random.between(-12, 12);
      expect(between).toBeGreaterThanOrEqual(-12);
      expect(between).toBeLessThan(12);
    }
  });
});

describe('fnv1a', () => {
  it.each([
    ['', 0x811c9dc5],
    ['a', 0xe40c292c],
    ['foobar', 0xbf9cf968],
  ])('hashes “%s” to %d', (text, hash) => {
    expect(fnv1a(text)).toBe(hash);
  });
});

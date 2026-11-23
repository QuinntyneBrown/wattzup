import { shadowLength, shadowShape } from './rider-shadow-shape';

describe("the shape of a rider's shadow in the sun (L2-166 AC35)", () => {
  // A heading of 0 points the bike along -z.
  it('is the bike seen from its side, as wide as the bike is long, when the sun is abeam', () => {
    const shape = shadowShape(0, 1, 0);
    expect(shape.side).toBe(true);
    expect(shape.width).toBeCloseTo(1.75);
  });

  it('is the rider seen end on, as wide as their shoulders, when the sun is ahead or behind', () => {
    for (const sunZ of [-1, 1]) {
      const shape = shadowShape(0, 0, sunZ);
      expect(shape.side).toBe(false);
      expect(shape.width).toBeCloseTo(0.62);
    }
  });

  it('widens from one to the other as the sun comes round', () => {
    const quarter = shadowShape(0, Math.SQRT1_2, -Math.SQRT1_2);
    expect(quarter.width).toBeGreaterThan(0.62);
    expect(quarter.width).toBeLessThan(1.75);
    expect(shadowShape(0, 0.3, -0.95).side).toBe(false);
    expect(shadowShape(0, 0.95, -0.3).side).toBe(true);
  });

  it('faces the other way when the sun is on the other side', () => {
    expect(shadowShape(0, 1, 0).flipped).not.toBe(shadowShape(0, -1, 0).flipped);
  });

  it('follows the bike as it turns under a sun that stays put', () => {
    // Turned a quarter of the way round, a sun that was ahead is abeam.
    expect(shadowShape(Math.PI / 2, 0, -1).side).toBe(true);
  });

  it("does not mind how long the sun's direction is", () => {
    expect(shadowShape(0, 5, 0)).toEqual(shadowShape(0, 1, 0));
  });
});

describe('shadowLength (L2-166 AC41)', () => {
  it('is the rider’s height over the tangent of the sun’s angle', () => {
    // The sun 45 degrees up: a shadow as long as the rider is tall.
    expect(shadowLength(Math.SQRT1_2)).toBeCloseTo(1.65, 2);
    // 30 degrees up: longer by the square root of three.
    expect(shadowLength(0.5)).toBeCloseTo(1.65 * Math.sqrt(3), 2);
  });

  it('is longer the lower the sun', () => {
    expect(shadowLength(0.3)).toBeGreaterThan(shadowLength(0.5));
  });

  it('is held to 6.5 m at sunset and on the horizon', () => {
    expect(shadowLength(0.11)).toBe(6.5);
    expect(shadowLength(0)).toBe(6.5);
  });

  it('is never shorter than 1.4 m, however high the sun', () => {
    expect(shadowLength(0.95)).toBe(1.4);
    expect(shadowLength(1)).toBe(1.4);
  });
});

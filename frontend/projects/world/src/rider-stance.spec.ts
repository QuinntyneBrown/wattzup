import { outOfTheSaddle } from './rider-stance';

describe('when a rider stands on the pedals (L2-166 AC29)', () => {
  it('sits on the flat, downhill and on a gentle rise', () => {
    expect(outOfTheSaddle(0)).toBe(0);
    expect(outOfTheSaddle(-6)).toBe(0);
    expect(outOfTheSaddle(5)).toBe(0);
  });

  it('stands on a steep climb', () => {
    expect(outOfTheSaddle(7)).toBe(1);
    expect(outOfTheSaddle(12)).toBe(1);
  });

  it('rises out of the saddle as the road steepens, without a jump', () => {
    expect(outOfTheSaddle(6)).toBeCloseTo(0.5);
    expect(outOfTheSaddle(5.5)).toBeGreaterThan(0);
    expect(outOfTheSaddle(5.5)).toBeLessThan(outOfTheSaddle(6));
    expect(outOfTheSaddle(5.01)).toBeLessThan(0.01);
    expect(outOfTheSaddle(6.99)).toBeGreaterThan(0.99);
  });
});

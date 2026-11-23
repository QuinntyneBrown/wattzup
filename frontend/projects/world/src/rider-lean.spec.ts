import { bendLean } from './rider-lean';

describe('how far a rider leans into a bend (L2-166 AC27)', () => {
  it('rides upright on a straight', () => {
    expect(bendLean(1.2, 1.2, 6)).toBe(0);
  });

  it('leans to the side the road turns', () => {
    expect(bendLean(0, 0.1, 6)).toBeGreaterThan(0);
    expect(bendLean(0, -0.1, 6)).toBeLessThan(0);
    expect(bendLean(0, -0.1, 6)).toBeCloseTo(-bendLean(0, 0.1, 6));
  });

  it('leans further the tighter the bend', () => {
    expect(bendLean(0, 0.2, 6)).toBeGreaterThan(bendLean(0, 0.1, 6));
  });

  it('leans as the speed and the bend ask: 10 m/s round 60 m is some ten degrees', () => {
    expect(bendLean(0, 6 / 60, 6)).toBeCloseTo(Math.atan(100 / (60 * 9.81)), 5);
  });

  it('never leans past what a tyre would hold', () => {
    expect(bendLean(0, 1.5, 6)).toBeCloseTo(0.35);
    expect(bendLean(0, -1.5, 6)).toBeCloseTo(-0.35);
  });

  it('takes the short way round where the heading wraps', () => {
    expect(bendLean(Math.PI - 0.05, -Math.PI + 0.05, 6)).toBeCloseTo(bendLean(0, 0.1, 6));
  });
});

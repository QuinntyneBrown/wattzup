import { regionOf, turnTime } from './rider-turn';

describe("where a crank's angle is in the rider's baked turn (L2-166 AC26)", () => {
  it('is the start of the turn with the crank at the top', () => {
    expect(turnTime(0, 1)).toBe(0);
  });

  it('runs evenly through the turn', () => {
    expect(turnTime(Math.PI / 2, 1)).toBeCloseTo(0.25);
    expect(turnTime(Math.PI, 2)).toBeCloseTo(1);
    expect(turnTime(1.5 * Math.PI, 1)).toBeCloseTo(0.75);
  });

  it('begins again with each turn of the cranks, however many they have made', () => {
    expect(turnTime(2 * Math.PI, 1)).toBeCloseTo(0);
    expect(turnTime(2 * Math.PI * 40 + Math.PI, 1)).toBeCloseTo(0.5);
  });

  it('is the same place in the turn for a crank turned backwards', () => {
    expect(turnTime(-Math.PI / 2, 1)).toBeCloseTo(0.75);
  });

  it('never reaches the end of the turn, which is the start of the next', () => {
    expect(turnTime(2 * Math.PI - 1e-9, 1)).toBeLessThan(1);
  });
});

describe("which part of the body a vertex's marker names (L2-166 AC26)", () => {
  it.each([
    [1, 0, 0, 'skin'],
    [0, 1, 0, 'shorts'],
    [0, 0, 1, 'gripper'],
    [1, 1, 0, 'sock'],
    [1, 0, 1, 'glove'],
    [0, 1, 1, 'hair'],
    [1, 1, 1, 'kit'],
  ] as const)('reads %d, %d, %d as %s', (r, g, b, region) => {
    expect(regionOf(r, g, b)).toBe(region);
  });

  it('reads a marker a file has stored a little off', () => {
    expect(regionOf(0.98, 0.03, 0.01)).toBe('skin');
    expect(regionOf(0.02, 0.97, 0.99)).toBe('hair');
  });

  it('reads what carries no marker as skin', () => {
    expect(regionOf(0, 0, 0)).toBe('skin');
  });
});

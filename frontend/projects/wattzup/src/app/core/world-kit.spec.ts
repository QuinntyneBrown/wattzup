import { bob, loopFade, wrapFade } from './world-kit';

describe('wrapFade: a part shrinks away before it wraps and grows back after (#897)', () => {
  it.each([
    ['at the low end', 0, 0],
    ['half the fade in from the low end', 2.5, 0.5],
    ['the whole fade in from the low end', 5, 1],
    ['in the middle', 50, 1],
    ['the whole fade short of the high end', 95, 1],
    ['half the fade short of the high end', 97.5, 0.5],
    ['at the high end', 100, 0],
  ])('%s: %d gives %d', (_, value, shown) => {
    expect(wrapFade(value, 0, 100, 5)).toBeCloseTo(shown, 9);
  });
});

describe('loopFade: a looping part fades out only at the far end of its loop (#897)', () => {
  it.each([
    ['just behind the rider, where it wraps out of view', -24, 1],
    ['beside the rider', 0, 1],
    ['well ahead', 300, 1],
    ['halfway into the far fade', 356, 0.5],
    ['at the far end, where it wraps', 376, 0],
  ])('%s: %d m gives %d', (_, metres, shown) => {
    expect(loopFade(metres, 400, 24)).toBeCloseTo(shown, 9);
  });
});

describe('bob: a step or bounce with no snap at its bottom (#897)', () => {
  it.each([
    ['at the bottom', 0, 0],
    ['a quarter period on', Math.PI / 4, 0.5],
    ['at the top', Math.PI / 2, 1],
    ['back at the bottom', Math.PI, 0],
  ])('%s', (_, phase, height) => {
    expect(bob(phase)).toBeCloseTo(height, 9);
  });

  it('leaves the bottom as gently as it arrives, unlike |sin|', () => {
    const e = 1e-4;
    expect((bob(e) - bob(0)) / e).toBeCloseTo(0, 3);
    expect((bob(Math.PI) - bob(Math.PI - e)) / e).toBeCloseTo(0, 3);
  });
});

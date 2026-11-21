import { CountdownClock, progressWidth } from './countdown-clock';
import { testWorkout } from './test-state';

describe('CountdownClock (L2-024)', () => {
  it('interpolates progress 0.5 s after the anchor', () => {
    const c = new CountdownClock();
    c.anchor(testWorkout({ segment: 9, remaining: 10 }), 1000);
    expect(c.remainingAt(1500)).toBe(9.5);
    expect(c.progressAt(1500)).toBeCloseTo((40 - 9.5) / 40);
  });
  it('caps the drift at 1.25 s', () => {
    const c = new CountdownClock();
    c.anchor(testWorkout({ remaining: 10 }), 0);
    expect(c.remainingAt(5000)).toBe(8.75);
  });
  it('never goes below 0', () => {
    const c = new CountdownClock();
    c.anchor(testWorkout({ remaining: 1 }), 0);
    expect(c.remainingAt(2000)).toBe(0);
  });
  it('does not drift when not running', () => {
    const c = new CountdownClock();
    c.anchor(testWorkout({ status: 'paused', remaining: 10 }), 0);
    expect(c.remainingAt(800)).toBe(10);
    expect(c.elapsedAt(800)).toBe(427);
  });
  it('caps elapsed at the total', () => {
    const c = new CountdownClock();
    c.anchor(testWorkout({ elapsed_seconds: 760, remaining: 0 }), 0);
    expect(c.elapsedAt(1000)).toBe(760);
  });
  it('is empty with no workout', () => {
    const c = new CountdownClock();
    c.anchor(null, 0);
    expect(c.remainingAt(10)).toBe(0);
    expect(c.progressAt(10)).toBe(0);
  });
});

describe('progressWidth', () => {
  it.each([
    [-0.1, '0%'],
    [0, '0%'],
    [0.001, '0%'],
    [0.0024, '0%'],
    [0.0026, '0.5%'],
    [0.124, '12.5%'],
    [0.5, '50%'],
    [0.998, '100%'],
    [1.2, '100%'],
  ])('quantizes progress %d to %s so sub-pixel ticks coalesce', (ratio, expected) => {
    expect(progressWidth(ratio)).toBe(expected);
  });
});

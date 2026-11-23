// Unit test
// Traces to: L2-048 AC4; L2-049 AC1; L2-085 AC1 (WAI-ARIA radio group)
// Description: an arrow key moves the choice to the next option that can be chosen, wrapping at either end and passing
// over any that cannot; another key, or no other option to move to, moves nothing.
import { radioStep } from './radio-step';

describe('radioStep', () => {
  const open = [false, false, false];

  it('moves to the next option on ArrowDown or ArrowRight, and the one before on ArrowUp or ArrowLeft', () => {
    expect(radioStep('ArrowDown', 0, open)).toBe(1);
    expect(radioStep('ArrowRight', 1, open)).toBe(2);
    expect(radioStep('ArrowUp', 2, open)).toBe(1);
    expect(radioStep('ArrowLeft', 1, open)).toBe(0);
  });

  it('wraps at either end', () => {
    expect(radioStep('ArrowDown', 2, open)).toBe(0);
    expect(radioStep('ArrowUp', 0, open)).toBe(2);
  });

  it('passes over an option that cannot be chosen', () => {
    expect(radioStep('ArrowDown', 1, [false, false, true])).toBe(0);
    expect(radioStep('ArrowUp', 0, [false, false, true])).toBe(1);
  });

  it('moves nothing for another key, or with no other option to move to', () => {
    expect(radioStep('Enter', 0, open)).toBeNull();
    expect(radioStep('ArrowDown', 0, [false, true])).toBeNull();
  });
});

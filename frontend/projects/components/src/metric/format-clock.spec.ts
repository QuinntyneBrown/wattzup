// Unit test
// Traces to: L2-087 AC1; L2-089 AC1; L2-080 AC1
// Description: a ride clock or countdown in whole seconds reads m:ss, or h:mm:ss from an hour.
import { formatClock } from './format-clock';

describe('formatClock', () => {
  it.each([
    [0, '0:00'],
    [9.9, '0:09'],
    [90, '1:30'],
    [420, '7:00'],
    [1800, '30:00'],
    [3600, '1:00:00'],
    [3725, '1:02:05'],
    [-1, '0:00'],
  ])('%d s reads %s', (seconds, reads) => {
    expect(formatClock(seconds)).toBe(reads);
  });
});

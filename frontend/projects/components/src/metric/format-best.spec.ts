// Unit test
// Traces to: L2-046 AC2; L2-047 AC1
// Description: a best time in whole seconds reads in minutes and seconds, an hour or more too ("71:20"), as the mocks
// write it on Map Select and Race Setup.
import { formatBest } from './format-best';

describe('formatBest', () => {
  it.each([
    [0, '0:00'],
    [9.9, '0:09'],
    [1630, '27:10'],
    [3483, '58:03'],
    [4280, '71:20'],
    [-1, '0:00'],
  ])('%d s reads %s', (seconds, reads) => {
    expect(formatBest(seconds)).toBe(reads);
  });
});

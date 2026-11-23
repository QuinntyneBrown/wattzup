// Unit test
// Traces to: L2-061 AC1
// Description: a countdown's seconds as a screen reader says them, in minutes and seconds.
import { spokenDuration } from './spoken-duration';

describe('spokenDuration', () => {
  it.each([
    [0, '0 seconds'],
    [1, '1 second'],
    [29, '29 seconds'],
    [60, '1 minute'],
    [61, '1 minute 1 second'],
    [179, '2 minutes 59 seconds'],
    [180, '3 minutes'],
    [-3, '0 seconds'],
  ])('%d s reads “%s”', (seconds, spoken) => {
    expect(spokenDuration(seconds)).toBe(spoken);
  });
});

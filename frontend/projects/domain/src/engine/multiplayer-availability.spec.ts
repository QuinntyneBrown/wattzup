// Unit test
// Traces to: L2-135 AC4; L2-048 AC1; L2-085 AC5
// Description: a ride with other people is open when the browser is online and the screen's last read reached the
// service; with no network it is offline, whatever the last read said; online with a read that failed, unreachable.
import { multiplayerAvailability } from './multiplayer-availability';

describe('multiplayerAvailability', () => {
  for (const [online, reached, availability] of [
    [true, true, 'open'],
    [true, false, 'unreachable'],
    [false, true, 'offline'],
    [false, false, 'offline'],
  ] as const) {
    it(`is ${availability} when online is ${online} and the last read reached the service: ${reached}`, () => {
      expect(multiplayerAvailability(online, reached)).toBe(availability);
    });
  }
});

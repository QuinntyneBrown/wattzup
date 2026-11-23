// Unit test
// Traces to: L2-121 AC3
// Description: the clock offset is the server's time minus the midpoint of the round trip, taken from the sample with
// the shortest round trip, so a slow answer does not skew it.
import { measureClockOffset } from './clock-offset';

describe('measureClockOffset', () => {
  it('reads the server ahead by the time less half the round trip', () => {
    expect(measureClockOffset([{ sentAt: 1000, serverTime: 3050, receivedAt: 1100 }])).toBe(2000);
  });

  it('reads a server behind as a negative offset', () => {
    expect(measureClockOffset([{ sentAt: 5000, serverTime: 4010, receivedAt: 5020 }])).toBe(-1000);
  });

  it('takes the sample with the shortest round trip', () => {
    expect(
      measureClockOffset([
        { sentAt: 0, serverTime: 1900, receivedAt: 400 },
        { sentAt: 500, serverTime: 2020, receivedAt: 540 },
        { sentAt: 600, serverTime: 2400, receivedAt: 900 },
      ]),
    ).toBe(1500);
  });

  it('refuses to measure with no sample', () => {
    expect(() => measureClockOffset([])).toThrow(RangeError);
  });
});

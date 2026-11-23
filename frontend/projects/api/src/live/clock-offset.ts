/** One `serverTime()` call: the device time it was sent, the server's time it returned, the device time it came back. */
export interface ClockSample {
  readonly sentAt: number;
  readonly serverTime: number;
  readonly receivedAt: number;
}

/**
 * The device's clock offset from the server's (L2-121 AC3): the server's time minus the midpoint of the round trip, from
 * the sample with the shortest round trip, whose midpoint is the closest to when the server read its clock. Add it to
 * the device's time to read the server's.
 */
export function measureClockOffset(samples: readonly ClockSample[]): number {
  if (samples.length === 0) throw new RangeError('A clock offset needs at least one sample');
  const best = samples.reduce((shortest, sample) =>
    sample.receivedAt - sample.sentAt < shortest.receivedAt - shortest.sentAt ? sample : shortest,
  );
  return best.serverTime - (best.sentAt + best.receivedAt) / 2;
}

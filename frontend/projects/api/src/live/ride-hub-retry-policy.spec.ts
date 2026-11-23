// Unit test
// Traces to: L2-120 AC3
// Description: after a drop the app retries the ride hub after 0, 2, 5 and 10 seconds, then every 30 seconds for as
// long as the ride lasts: the policy never gives up.
import { RideHubRetryPolicy } from './ride-hub-retry-policy';

describe('RideHubRetryPolicy', () => {
  const policy = new RideHubRetryPolicy();
  const delay = (previousRetryCount: number) =>
    policy.nextRetryDelayInMilliseconds({
      previousRetryCount,
      elapsedMilliseconds: 0,
      retryReason: new Error('lost'),
    });

  it.each([
    [0, 0],
    [1, 2000],
    [2, 5000],
    [3, 10_000],
    [4, 30_000],
    [5, 30_000],
  ])('waits after %i retries %i ms', (retries, ms) => {
    expect(delay(retries)).toBe(ms);
  });

  it('keeps trying after an hour of retries', () => {
    expect(delay(120)).toBe(30_000);
  });
});

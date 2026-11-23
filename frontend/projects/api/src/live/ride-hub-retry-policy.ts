/** What the SignalR client tells a retry policy (`RetryContext` in `@microsoft/signalr`). */
export interface RetryContext {
  readonly previousRetryCount: number;
  readonly elapsedMilliseconds: number;
  readonly retryReason: Error;
}

/** The first retries' waits, then the steady one for as long as the ride lasts (L2-120 AC3). */
const FIRST = [0, 2000, 5000, 10_000];
const STEADY = 30_000;

/**
 * The ride hub's reconnect pacing (`IRetryPolicy` in `@microsoft/signalr`): retry after 0, 2, 5 and 10 seconds, then
 * every 30 seconds. It never answers `null`, so the client does not give up during a ride.
 */
export class RideHubRetryPolicy {
  nextRetryDelayInMilliseconds({ previousRetryCount }: RetryContext): number {
    return FIRST[previousRetryCount] ?? STEADY;
  }
}

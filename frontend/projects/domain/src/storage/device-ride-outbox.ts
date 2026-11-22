import { HttpErrorResponse } from '@angular/common/http';
import {
  DestroyRef,
  Injectable,
  type Signal,
  type WritableSignal,
  inject,
  signal,
} from '@angular/core';
import {
  RIDES_API,
  RIDES_WAITING,
  type RideOutbox,
  type RideSyncState,
  type SubmitRideRequest,
  type WaitingRide,
} from '@telo/api';

/** The rides whose state the outbox follows at once: a session's last few, never every ride of a long session. */
const HELD = 10;

const SENDING: RideSyncState = { kind: 'sending' };
const WAITING: RideSyncState = { kind: 'waitingOffline' };
const NOT_RECORDED: RideSyncState = { kind: 'notRecorded' };

/** How long the outbox waits before sending again a ride whose race result the backend has not recorded yet. */
export const RESULT_RETRY_MS = 5_000;

/** How long it keeps sending such a ride: past the race's 2-minute finish window (L2-071 AC3), with room to spare. */
export const RESULT_WAIT_MS = 180_000;

/** The first wait before sending again rides that did not reach the backend, and the longest (L2-135 AC2). */
export const FIRST_RETRY_MS = 30_000;
export const LONGEST_RETRY_MS = 3_600_000;

/** The wait before the next try after `attempts` tries that did not reach the backend: 30 s, doubling up to an hour. */
export function retryDelay(attempts: number): number {
  return Math.min(LONGEST_RETRY_MS, FIRST_RETRY_MS * 2 ** Math.max(0, attempts - 1));
}

/** What became of one try: recorded, kept to be sent again, dropped for good, or waiting for a race's result. */
type Outcome = 'recorded' | 'kept' | 'dropped' | 'pending';

/**
 * The finished rides on their way to the backend, kept on the device until it has them
 * (docs/detailed-designs/performance/ride-without-a-network). `submit` keeps the ride in `RIDES_WAITING` before sending
 * it. Waiting rides are sent one at a time, oldest first: when the outbox starts with the app, when the browser is back
 * online, after each new ride and on a retry timer. A ride the backend records is removed. One that does not reach it
 * (no answer, 5xx, 429, or an ended session's 401, L2-004 AC4) is kept and tried again 30 seconds later, the delay
 * doubling up to an hour (L2-135 AC2). One the backend refuses for good (422 `ride_not_plausible`, another 4xx) is
 * dropped as not recorded (L2-074 AC4). A riders-online race the backend answers `result_pending` is sent again every
 * 5 seconds for up to 3 minutes (L2-125 AC1) without holding up the rides behind it. It follows the state of the last
 * ten rides for Results, and its network listener and timers go with it.
 */
@Injectable()
export class DeviceRideOutbox implements RideOutbox {
  private readonly rides = inject(RIDES_API);
  private readonly waiting = inject(RIDES_WAITING);
  private readonly held = new Map<string, WritableSignal<RideSyncState>>();
  /** Rides whose race result is pending, with when the backend first said so; the drain passes them by. */
  private readonly pendingSince = new Map<string, number>();
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private retry: ReturnType<typeof setTimeout> | null = null;
  private draining = false;
  private again = false;
  private destroyed = false;

  constructor() {
    const online = () => void this.drain();
    window.addEventListener('online', online);
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      window.removeEventListener('online', online);
      this.clearRetry();
      for (const timer of this.timers) clearTimeout(timer);
      this.timers.clear();
    });
    void this.drain();
  }

  submit(ride: SubmitRideRequest): void {
    if (this.held.has(ride.rideId)) return;
    this.follow(ride.rideId);
    void this.waiting
      .put({ rideId: ride.rideId, finishedAt: ride.finishedAt, attempts: 0, ride })
      .then(() => this.drain());
  }

  status(rideId: string): Signal<RideSyncState> {
    return this.held.get(rideId)?.asReadonly() ?? signal(SENDING).asReadonly();
  }

  /**
   * Sends the waiting rides one at a time, oldest first, until one does not reach the backend, which stops the drain
   * and sets the retry timer. A call while a drain runs makes it go round again once it ends, unless it stopped.
   */
  private async drain(): Promise<void> {
    if (this.draining) {
      this.again = true;
      return;
    }
    this.draining = true;
    this.clearRetry();
    try {
      let stopped = false;
      do {
        this.again = false;
        for (const waiting of await this.waiting.oldestFirst()) {
          if (this.destroyed) return;
          if (this.pendingSince.has(waiting.rideId)) continue;
          const outcome = await this.send(waiting);
          if (this.destroyed) return;
          if (outcome === 'kept') {
            const attempts = waiting.attempts + 1;
            await this.waiting.put({ ...waiting, attempts });
            this.retryIn(retryDelay(attempts));
            stopped = true;
            break;
          }
          if (outcome === 'pending') this.waitForResult(waiting);
          else await this.waiting.remove(waiting.rideId);
        }
      } while (this.again && !stopped && !this.destroyed);
    } finally {
      this.draining = false;
    }
  }

  /** Sends one ride and follows it: recorded, kept, dropped, or pending a race's result. */
  private send(waiting: WaitingRide): Promise<Outcome> {
    const state = this.follow(waiting.rideId);
    state.set(SENDING);
    return new Promise((resolve) => {
      this.rides.submitRide(waiting.ride).subscribe({
        next: (answer) => {
          this.pendingSince.delete(waiting.rideId);
          state.set({ kind: 'recorded', answer });
          resolve('recorded');
        },
        error: (error: unknown) => {
          if (resultPending(error)) {
            resolve('pending');
          } else if (unreached(error)) {
            this.pendingSince.delete(waiting.rideId);
            state.set(WAITING);
            resolve('kept');
          } else {
            this.pendingSince.delete(waiting.rideId);
            state.set(NOT_RECORDED);
            resolve('dropped');
          }
        },
      });
    });
  }

  /**
   * Sends again in 5 seconds a race whose result the backend has not recorded yet, for up to 3 minutes from its first
   * `result_pending`; past that it is not recorded, and removed.
   */
  private waitForResult(waiting: WaitingRide): void {
    const now = Date.now();
    const since = this.pendingSince.get(waiting.rideId) ?? now;
    if (now - since + RESULT_RETRY_MS > RESULT_WAIT_MS) {
      this.pendingSince.delete(waiting.rideId);
      this.follow(waiting.rideId).set(NOT_RECORDED);
      void this.waiting.remove(waiting.rideId);
      return;
    }
    this.pendingSince.set(waiting.rideId, since);
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      void this.send(waiting).then((outcome) => {
        if (this.destroyed) return;
        if (outcome === 'pending') this.waitForResult(waiting);
        else if (outcome === 'kept') this.retryIn(retryDelay(waiting.attempts + 1));
        else void this.waiting.remove(waiting.rideId);
      });
    }, RESULT_RETRY_MS);
    this.timers.add(timer);
  }

  /** The state of a ride the outbox follows, following it now if it was not; only the last ten are kept. */
  private follow(rideId: string): WritableSignal<RideSyncState> {
    let state = this.held.get(rideId);
    if (!state) {
      state = signal(SENDING);
      this.held.set(rideId, state);
      for (const oldest of [...this.held.keys()].slice(0, Math.max(0, this.held.size - HELD))) {
        this.held.delete(oldest);
      }
    }
    return state;
  }

  private retryIn(delay: number): void {
    this.clearRetry();
    this.retry = setTimeout(() => {
      this.retry = null;
      void this.drain();
    }, delay);
  }

  private clearRetry(): void {
    if (this.retry !== null) clearTimeout(this.retry);
    this.retry = null;
  }
}

/** Whether the backend refused the ride because the race's result is not recorded yet (L2-125 AC1). */
function resultPending(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status === 409 &&
    (error.error as { code?: unknown } | null)?.code === 'result_pending'
  );
}

/**
 * Whether the ride did not reach a backend that could record it: no answer, a server error, too many requests, or an
 * ended session, which keeps the ride until the rider signs in again (L2-004 AC4).
 */
function unreached(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) return false;
  return error.status === 0 || error.status >= 500 || error.status === 429 || error.status === 401;
}

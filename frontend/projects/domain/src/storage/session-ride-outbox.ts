import { HttpErrorResponse } from '@angular/common/http';
import {
  DestroyRef,
  Injectable,
  type Signal,
  type WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { RIDES_API, type RideOutbox, type RideSyncState, type SubmitRideRequest } from '@telo/api';

/** The rides the outbox holds at once: a session's last few, never every ride of a long session. */
const HELD = 10;

const SENDING: RideSyncState = { kind: 'sending' };

/** How long the outbox waits before sending again a ride whose race result the backend has not recorded yet. */
export const RESULT_RETRY_MS = 5_000;

/** How long it keeps sending such a ride: past the race's 2-minute finish window (L2-071 AC3), with room to spare. */
export const RESULT_WAIT_MS = 180_000;

interface Held {
  readonly ride: SubmitRideRequest;
  readonly state: WritableSignal<RideSyncState>;
  /** When the backend first answered `result_pending`, on the page's clock. */
  pendingSince?: number;
}

/**
 * The finished rides of this session on their way to the backend (docs/detailed-designs/results/show-xp-stars-and-
 * personal-best), until L2-135 keeps them in browser storage. A ride is sent once for its ride id; one that never
 * reached the backend waits offline and is sent again when the browser is back online. A riders-online race the backend
 * answers `result_pending`, its result not recorded yet, stays sending and is sent again every 5 seconds for up to 3
 * minutes (L2-125 AC1). One the backend refused otherwise or failed is not recorded. It holds the last ten rides, and
 * its network listener and retry timers go with it.
 */
@Injectable()
export class SessionRideOutbox implements RideOutbox {
  private readonly rides = inject(RIDES_API);
  private readonly held = new Map<string, Held>();
  private readonly retries = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    const online = () => this.sendWaiting();
    window.addEventListener('online', online);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', online);
      for (const retry of this.retries) clearTimeout(retry);
      this.retries.clear();
    });
  }

  submit(ride: SubmitRideRequest): void {
    if (this.held.has(ride.rideId)) return;
    const entry: Held = { ride, state: signal(SENDING) };
    this.held.set(ride.rideId, entry);
    for (const oldest of [...this.held.keys()].slice(0, Math.max(0, this.held.size - HELD))) {
      this.held.delete(oldest);
    }
    this.send(entry);
  }

  status(rideId: string): Signal<RideSyncState> {
    return this.held.get(rideId)?.state.asReadonly() ?? signal(SENDING).asReadonly();
  }

  private send(entry: Held): void {
    entry.state.set(SENDING);
    this.rides.submitRide(entry.ride).subscribe({
      next: (answer) => entry.state.set({ kind: 'recorded', answer }),
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 0) {
          entry.state.set({ kind: 'waitingOffline' });
        } else if (resultPending(error) && this.mayWait(entry)) {
          this.retry(entry);
        } else {
          entry.state.set({ kind: 'notRecorded' });
        }
      },
    });
  }

  /** Whether a ride the backend answered `result_pending` is still within the 3 minutes it is sent for. */
  private mayWait(entry: Held): boolean {
    const now = Date.now();
    entry.pendingSince ??= now;
    return now - entry.pendingSince + RESULT_RETRY_MS <= RESULT_WAIT_MS;
  }

  /** Sends the ride again in 5 seconds, unless the outbox has dropped it or gone by then. */
  private retry(entry: Held): void {
    const retry = setTimeout(() => {
      this.retries.delete(retry);
      if (this.held.get(entry.ride.rideId) === entry) this.send(entry);
    }, RESULT_RETRY_MS);
    this.retries.add(retry);
  }

  private sendWaiting(): void {
    for (const entry of this.held.values()) {
      if (entry.state().kind === 'waitingOffline') this.send(entry);
    }
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

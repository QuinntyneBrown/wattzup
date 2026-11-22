import { InjectionToken } from '@angular/core';
import type { SubmitRideRequest } from './rides-api';

/** A finished ride kept on the device until the backend has it (L2-135 AC1): its id, when it finished, and its tries. */
export interface WaitingRide {
  readonly rideId: string;
  /** ISO 8601, in UTC: the ride's own `finishedAt`, which orders the rides oldest first. */
  readonly finishedAt: string;
  /** How often it has been sent without reaching the backend. */
  readonly attempts: number;
  readonly ride: SubmitRideRequest;
}

/**
 * The finished rides waiting on the device for the backend (docs/detailed-designs/performance/ride-without-a-network):
 * kept by ride id, listed oldest first, and removed once the backend has settled them (L2-135 AC1, AC2).
 */
export interface RidesWaiting {
  oldestFirst(): Promise<readonly WaitingRide[]>;
  /** Keeps the ride, or replaces the one kept with its id. */
  put(waiting: WaitingRide): Promise<void>;
  remove(rideId: string): Promise<void>;
}

export const RIDES_WAITING = new InjectionToken<RidesWaiting>('RIDES_WAITING');

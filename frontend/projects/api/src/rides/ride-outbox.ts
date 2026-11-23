import { InjectionToken, type Signal } from '@angular/core';
import type { RideRecordedDto, SubmitRideRequest } from './rides-api';

/**
 * Where a finished ride stands with the backend (docs/detailed-designs/results/show-xp-stars-and-personal-best): being
 * sent, recorded with the backend's answer, waiting for a network (the request never reached the backend, L2-074 AC3), or
 * not recorded (the backend refused it, as with 422 `ride_not_plausible`, or failed, AC4).
 */
export type RideSyncState =
  | { readonly kind: 'sending' }
  | { readonly kind: 'recorded'; readonly answer: RideRecordedDto }
  | { readonly kind: 'waitingOffline' }
  | { readonly kind: 'notRecorded' };

/**
 * The finished rides on their way to the backend (L2-044 AC2, L2-135): `submit` keeps a ride on the device and sends it
 * once for its ride id, a second call for the same id changing nothing, and `status` follows it. A ride waiting for a
 * network is sent again when the app starts, when the browser is back online and after a growing delay.
 */
export interface RideOutbox {
  submit(ride: SubmitRideRequest): void;
  /** The ride's state; `sending` for a ride id the outbox has not been given. */
  status(rideId: string): Signal<RideSyncState>;
}

export const RIDE_OUTBOX = new InjectionToken<RideOutbox>('RIDE_OUTBOX');

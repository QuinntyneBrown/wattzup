import { InjectionToken, type Signal } from '@angular/core';
import type { RiderMe } from './riders-api';

/**
 * Whether a rider is signed in: `unknown` until asked, `signedIn`, `signedOut` once the backend answered 401, or
 * `unreachable` when it gave no answer of its own, and screens open all the same (L2-004 AC5).
 */
export type RiderStatus = 'unknown' | 'signedIn' | 'signedOut' | 'unreachable';

/** The current rider, shared by every screen (Stay signed in). */
export interface CurrentRider {
  readonly status: Signal<RiderStatus>;
  readonly rider: Signal<RiderMe | null>;
  /** Asks the backend once, then answers what it learned. */
  load(): Promise<RiderStatus>;
  /** A confirmed code signed `rider` in (L2-002 AC2). */
  signedIn(rider: RiderMe): void;
  /** The session has ended: the next screen that needs one opens sign-in (L2-004 AC3). */
  signedOut(): void;
}

export const CURRENT_RIDER = new InjectionToken<CurrentRider>('CURRENT_RIDER');

import { InjectionToken, type Signal } from '@angular/core';

/**
 * Whether a ride is in progress: from the start of a race, class or custom ride until its Results open or the rider
 * leaves it (L2-150 AC2). The app never reloads into a new version while one is.
 */
export interface RideActivity {
  readonly inProgress: Signal<boolean>;
  /** A ride has started. */
  begin(): void;
  /** The ride has finished, or the rider has left it. */
  end(): void;
}

export const RIDE_ACTIVITY = new InjectionToken<RideActivity>('RIDE_ACTIVITY');

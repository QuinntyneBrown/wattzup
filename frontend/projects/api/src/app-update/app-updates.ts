import { InjectionToken, type Signal } from '@angular/core';

/**
 * New versions of the app (L2-150 AC2, docs/detailed-designs/platform/install-the-app): an installed app keeps the
 * version it last loaded until the rider reloads into the next one.
 */
export interface AppUpdates {
  /** Whether a new version has downloaded and is ready to load, or the loaded one can no longer run as it is. */
  readonly ready: Signal<boolean>;
  /** Switches to the new version and loads the app again. Called only by the rider's Reload, never on its own. */
  reload(): Promise<void>;
}

export const APP_UPDATES = new InjectionToken<AppUpdates>('APP_UPDATES');

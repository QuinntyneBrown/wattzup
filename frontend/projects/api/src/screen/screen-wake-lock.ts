import { InjectionToken } from '@angular/core';

/** Keeps the screen awake while a ride runs (L2-133 AC3); does nothing where the browser cannot. */
export interface ScreenWakeLock {
  /** Keeps the screen awake, and keeps it awake again whenever the tab comes back into view. */
  hold(): void;
  /** Lets the screen sleep again. */
  release(): void;
}

export const SCREEN_WAKE_LOCK = new InjectionToken<ScreenWakeLock>('SCREEN_WAKE_LOCK');

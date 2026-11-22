import { InjectionToken, type Signal } from '@angular/core';

/**
 * Every ride setting on Settings, kept on this device (L2-158). Each slice of Settings adds its own: slice 20.1 the
 * first, Keep the screen awake (L2-164 AC5).
 */
export interface RideSettings {
  /** Holds a screen wake lock while a ride runs; on by default. */
  readonly keepAwake: boolean;
}

/**
 * The ride settings as signals, kept in this browser for this device only and never sent anywhere (L2-158 AC3, AC4).
 * Every reader follows `settings`, so a change applies at once, to a running ride too.
 */
export interface RideSettingsStore {
  readonly settings: Signal<RideSettings>;
  /** False when the browser refuses storage: the settings then last until the tab closes (L2-158 AC7). */
  readonly persisted: Signal<boolean>;
  set<K extends keyof RideSettings>(key: K, value: RideSettings[K]): void;
  /** Puts every setting back to its recommended value (L2-158 AC6). */
  reset(): void;
}

export const RIDE_SETTINGS = new InjectionToken<RideSettingsStore>('RIDE_SETTINGS');

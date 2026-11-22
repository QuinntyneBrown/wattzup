import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import type { RideSettings, RideSettingsStore } from '@telo/api';

/** Where the ride settings live in localStorage. */
export const RIDE_SETTINGS_KEY = 'telo-ride.settings.v1';

/** Each setting's value before the rider changes it, and after Reset to recommended (L2-158 AC6). */
export const RECOMMENDED_SETTINGS: RideSettings = { keepAwake: true };

/**
 * Reads the stored settings field by field: a missing, malformed or out-of-range field takes its recommended value,
 * and an unknown field is dropped (L2-158 AC5).
 */
export function parseRideSettings(raw: string | null): RideSettings {
  let stored: unknown;
  try {
    stored = raw === null ? null : JSON.parse(raw);
  } catch {
    stored = null;
  }
  const fields =
    typeof stored === 'object' && stored !== null ? (stored as Record<string, unknown>) : {};
  return {
    keepAwake:
      typeof fields['keepAwake'] === 'boolean'
        ? fields['keepAwake']
        : RECOMMENDED_SETTINGS.keepAwake,
  };
}

/**
 * `RideSettingsStore` in this browser's localStorage: read once at start, written on each change. When the browser
 * refuses storage (a private window, blocked site data) the settings live in memory for the tab and `persisted` is
 * false (L2-158 AC7). It has no HTTP client: nothing in it can send a setting off the device (AC4).
 */
@Injectable()
export class LocalRideSettingsStore implements RideSettingsStore {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly current = signal(RECOMMENDED_SETTINGS);
  private readonly kept = signal(true);
  readonly settings = this.current.asReadonly();
  readonly persisted = this.kept.asReadonly();

  constructor() {
    try {
      this.current.set(parseRideSettings(this.storage().getItem(RIDE_SETTINGS_KEY)));
    } catch {
      this.kept.set(false);
    }
  }

  set<K extends keyof RideSettings>(key: K, value: RideSettings[K]): void {
    this.keep({ ...this.current(), [key]: value });
  }

  reset(): void {
    this.keep(RECOMMENDED_SETTINGS);
  }

  private keep(settings: RideSettings): void {
    this.current.set(settings);
    try {
      this.storage().setItem(RIDE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      this.kept.set(false);
    }
  }

  private storage(): Storage {
    const storage = this.window?.localStorage;
    if (!storage) throw new Error('No localStorage');
    return storage;
  }
}

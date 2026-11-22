import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import type { QualityChoice, RideSettings, RideSettingsStore } from '@telo/api';

/** Where the ride settings live in localStorage. */
export const RIDE_SETTINGS_KEY = 'telo-ride.settings.v1';

/** Each setting's value before the rider changes it, and after Reset to recommended (L2-158 AC6). */
export const RECOMMENDED_SETTINGS: RideSettings = {
  quality: 'auto',
  stepDown: true,
  frameRate: 'display',
  resolution: 100,
  graphics: 'auto',
  keepAwake: true,
};

const QUALITIES: readonly QualityChoice[] = ['auto', 'ultra', 'high', 'medium', 'low'];

/** One of `allowed`, else the recommended value. */
function oneOf<T>(value: unknown, allowed: readonly T[], recommended: T): T {
  return allowed.includes(value as T) ? (value as T) : recommended;
}

/** 50 to 100 in steps of 5 (L2-160 AC5), else the recommended value. */
function resolution(value: unknown): number {
  return typeof value === 'number' && value >= 50 && value <= 100 && value % 5 === 0
    ? value
    : RECOMMENDED_SETTINGS.resolution;
}

/** A boolean, else the recommended value. */
function flag(value: unknown, recommended: boolean): boolean {
  return typeof value === 'boolean' ? value : recommended;
}

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
  const recommended = RECOMMENDED_SETTINGS;
  return {
    quality: oneOf(fields['quality'], QUALITIES, recommended.quality),
    stepDown: flag(fields['stepDown'], recommended.stepDown),
    frameRate: oneOf(fields['frameRate'], ['display', '30'] as const, recommended.frameRate),
    resolution: resolution(fields['resolution']),
    graphics: oneOf(fields['graphics'], ['auto', 'webgl2'] as const, recommended.graphics),
    keepAwake: flag(fields['keepAwake'], recommended.keepAwake),
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

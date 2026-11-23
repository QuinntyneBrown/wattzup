import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import type {
  DeviceCheckResult,
  DeviceCheckTrial,
  QualityChoice,
  ReduceMotionChoice,
  RideSettings,
  RideSettingsStore,
  ThemeChoice,
  WorldTier,
} from '@telo/api';

/** Where the ride settings live in localStorage. */
export const RIDE_SETTINGS_KEY = 'telo-ride.settings.v1';

/** Each setting's value before the rider changes it, and after Reset to recommended (L2-158 AC6). */
export const RECOMMENDED_SETTINGS: RideSettings = {
  quality: 'auto',
  stepDown: true,
  frameRate: 'display',
  resolution: 100,
  graphics: 'auto',
  deviceCheck: null,
  rideSound: true,
  rideSoundVolume: 70,
  worldMusic: true,
  muteUnderVideo: true,
  reduceMotion: 'device',
  theme: 'device',
  rideNumbers: 'standard',
  keepAwake: true,
  fullScreenOnStart: false,
  keepWorlds: true,
};

const QUALITIES: readonly QualityChoice[] = ['auto', 'ultra', 'high', 'medium', 'low'];
const DEVICE_OR_ON_OFF: readonly ReduceMotionChoice[] = ['device', 'on', 'off'];
const DEVICE_DARK_LIGHT: readonly ThemeChoice[] = ['device', 'dark', 'light'];

/** One of `allowed`, else the recommended value. */
function oneOf<T>(value: unknown, allowed: readonly T[], recommended: T): T {
  return allowed.includes(value as T) ? (value as T) : recommended;
}

/** A percentage from `min` to 100 in steps of 5 (L2-160 AC5, L2-163 AC1), else the recommended value. */
function percent(value: unknown, min: number, recommended: number): number {
  return typeof value === 'number' && value >= min && value <= 100 && value % 5 === 0
    ? value
    : recommended;
}

const LEVELS: readonly WorldTier[] = ['ultra', 'high', 'medium', 'low'];

/** A whole number of frames a second above 0. */
function isFps(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/** A level tried and the rate it held, else null. */
function trial(value: unknown): DeviceCheckTrial | null {
  if (typeof value !== 'object' || value === null) return null;
  const { level, fps } = value as Record<string, unknown>;
  return LEVELS.includes(level as WorldTier) && isFps(fps)
    ? { level: level as WorldTier, fps }
    : null;
}

/** The device check's result, whole and well formed, else none: Auto then starts as if never checked (L2-162 AC3). */
function deviceCheck(value: unknown): DeviceCheckResult | null {
  if (typeof value !== 'object' || value === null) return null;
  const { level, displayFps, tried, checkedAt } = value as Record<string, unknown>;
  if (!LEVELS.includes(level as WorldTier) || !isFps(displayFps) || !Array.isArray(tried))
    return null;
  if (typeof checkedAt !== 'string' || Number.isNaN(Date.parse(checkedAt))) return null;
  const trials = tried.map(trial);
  if (trials.some((t) => t === null)) return null;
  return {
    level: level as WorldTier,
    displayFps,
    tried: trials as DeviceCheckTrial[],
    checkedAt,
  };
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
    resolution: percent(fields['resolution'], 50, recommended.resolution),
    graphics: oneOf(fields['graphics'], ['auto', 'webgl2'] as const, recommended.graphics),
    deviceCheck: deviceCheck(fields['deviceCheck']),
    rideSound: flag(fields['rideSound'], recommended.rideSound),
    rideSoundVolume: percent(fields['rideSoundVolume'], 0, recommended.rideSoundVolume),
    worldMusic: flag(fields['worldMusic'], recommended.worldMusic),
    muteUnderVideo: flag(fields['muteUnderVideo'], recommended.muteUnderVideo),
    reduceMotion: oneOf(fields['reduceMotion'], DEVICE_OR_ON_OFF, recommended.reduceMotion),
    theme: oneOf(fields['theme'], DEVICE_DARK_LIGHT, recommended.theme),
    rideNumbers: oneOf(
      fields['rideNumbers'],
      ['standard', 'large'] as const,
      recommended.rideNumbers,
    ),
    keepAwake: flag(fields['keepAwake'], recommended.keepAwake),
    fullScreenOnStart: flag(fields['fullScreenOnStart'], recommended.fullScreenOnStart),
    keepWorlds: flag(fields['keepWorlds'], recommended.keepWorlds),
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

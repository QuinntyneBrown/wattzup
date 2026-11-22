import { InjectionToken, type Signal } from '@angular/core';
import type { DeviceCheckOutcome } from '../world/device-check';
import type { WorldTier } from '../world/world-renderer';

/** Quality: Auto, or a fixed level (L2-159 AC2). */
export type QualityChoice = 'auto' | WorldTier;

/** A choice that follows this device until the rider picks one (L2-164 AC2, AC3). */
export type ReduceMotionChoice = 'device' | 'on' | 'off';
export type ThemeChoice = 'device' | 'dark' | 'light';

/** The device check's result, kept on this device: what it found and when (L2-162 AC3). */
export interface DeviceCheckResult extends DeviceCheckOutcome {
  /** ISO 8601. */
  readonly checkedAt: string;
}

/**
 * Every ride setting on Settings, kept on this device (L2-158). Each slice of Settings adds its own: slice 20.1 the
 * first, Keep the screen awake (L2-164 AC5); slice 20.2 the World section's (L2-159, L2-160, L2-161); slice 20.3 the device check's result (L2-162); slice
 * 20.4 Sound's and Motion and display's (L2-163, L2-164).
 */
export interface RideSettings {
  /** Auto by default (L2-159 AC3). */
  readonly quality: QualityChoice;
  /** Whether slow frames lower a fixed level; always on with Auto (L2-160 AC1, AC2). */
  readonly stepDown: boolean;
  /** "Match display" or "30 fps" (L2-160 AC4). */
  readonly frameRate: 'display' | '30';
  /** The world's drawing buffer, 50 to 100 % in steps of 5 (L2-160 AC5). */
  readonly resolution: number;
  /** The graphics API: Automatic (WebGPU, else WebGL 2) or WebGL 2 (L2-161). */
  readonly graphics: 'auto' | 'webgl2';
  /** Where Auto starts on this device, once the device check has run; none until then (L2-159 AC4, L2-162 AC3). */
  readonly deviceCheck: DeviceCheckResult | null;
  /** Chain, freewheel, tyres and wind made in the browser as the rider pedals; on by default (L2-163 AC1). */
  readonly rideSound: boolean;
  /** Ride sound's volume, 0 to 100 % in steps of 5; 70 by default (L2-163 AC1). */
  readonly rideSoundVolume: number;
  /** Each world's own track, under the ride sound; on by default (L2-163 AC1). */
  readonly worldMusic: boolean;
  /** Ride sound goes quiet while a class video plays; on by default (L2-163 AC1). */
  readonly muteUnderVideo: boolean;
  /** Match device by default (L2-164 AC2). */
  readonly reduceMotion: ReduceMotionChoice;
  /** Match device by default: dark unless the device asks for light (L2-164 AC3). */
  readonly theme: ThemeChoice;
  /** Power, the clock and the target on every ride screen; Standard by default (L2-164 AC4). */
  readonly rideNumbers: 'standard' | 'large';
  /** Holds a screen wake lock while a ride runs; on by default (L2-164 AC5). */
  readonly keepAwake: boolean;
  /** Enters full screen on Start riding or Join; off by default (L2-164 AC6). */
  readonly fullScreenOnStart: boolean;
  /** Saves each world a ride downloads on this device; on by default (L2-165 AC3). */
  readonly keepWorlds: boolean;
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

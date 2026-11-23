import { InjectionToken } from '@angular/core';
import type { WorldTier } from './world-renderer';

/** A level the device check tried that did not hold the display's frame rate, and the rate it held (L2-162 AC2). */
export interface DeviceCheckTrial {
  readonly level: WorldTier;
  readonly fps: number;
}

/** Where the running check stands: "Trying High · 6 s left", the percentage, and what the levels tried held (AC2). */
export interface DeviceCheckProgress {
  readonly level: WorldTier;
  readonly secondsLeft: number;
  readonly percent: number;
  readonly tried: readonly DeviceCheckTrial[];
}

/**
 * What the check found: the first level that held the display's frame rate, or Low when none did; the display's rate;
 * and the levels tried before it, each with the rate it held (L2-162 AC2, AC3).
 */
export interface DeviceCheckOutcome {
  readonly level: WorldTier;
  readonly displayFps: number;
  readonly tried: readonly DeviceCheckTrial[];
}

export interface DeviceCheckOptions {
  /** From the top the graphics API allows, downward (AC2). */
  readonly levels: readonly WorldTier[];
  /** Settings' Graphics: WebGL 2 even where WebGPU is offered (L2-161 AC1). */
  readonly forceWebGL: boolean;
  readonly progress: (progress: DeviceCheckProgress) => void;
  /** Aborted when the rider stops the check or hides the tab (AC6). */
  readonly signal: AbortSignal;
}

/**
 * Rides a test world off screen at each level, about 30 seconds each, and stops at the first that holds the display's
 * frame rate (L2-162 AC2). Resolves null when stopped or when no world can be drawn, having disposed everything it
 * drew with and kept nothing (AC6).
 */
export interface DeviceCheck {
  run(options: DeviceCheckOptions): Promise<DeviceCheckOutcome | null>;
}

/** Loads the device check with the world library, on the rider's press, so neither is in Settings' chunk. */
export type DeviceCheckLoader = () => Promise<DeviceCheck>;

export const DEVICE_CHECK = new InjectionToken<DeviceCheckLoader>('DEVICE_CHECK');

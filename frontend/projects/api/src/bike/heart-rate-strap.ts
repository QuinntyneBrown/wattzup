import { InjectionToken } from '@angular/core';
import type { Signal } from '@angular/core';

/** The strap's link: none chosen, connecting, connected, or dropped and being retried. */
export type StrapState = 'none' | 'connecting' | 'connected' | 'disconnected';

/**
 * A Bluetooth heart-rate strap (docs/detailed-designs/bike/show-heart-rate). Every screen and store uses the token,
 * never an implementation.
 */
export interface HeartRateStrap {
  readonly state: Signal<StrapState>;
  /** The strap's name, as the device gives it, rendered as text; `null` before one is chosen. */
  readonly name: Signal<string | null>;
  /** The last bpm, `null` once the strap has sent none for 5 seconds (L2-031 AC4). */
  readonly bpm: Signal<number | null>;
  /** Opens the browser's chooser for the Heart Rate service; call it only from the rider's click (L2-031 AC1). */
  choose(): Promise<boolean>;
  /** Reconnects to the strap this browser chose before, without the chooser, where `getDevices()` exists (AC3). */
  reconnectRemembered(): Promise<boolean>;
  /** Drops the strap and stops retrying. */
  disconnect(): void;
}

export const HEART_RATE_STRAP = new InjectionToken<HeartRateStrap>('HEART_RATE_STRAP');

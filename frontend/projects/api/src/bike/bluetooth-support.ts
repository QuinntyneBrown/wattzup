import { InjectionToken, type Signal } from '@angular/core';

/**
 * Whether this browser and page can reach the bike (L2-008, L2-009): `'adapter-off'` arrives with
 * docs/detailed-designs/bike/keep-the-bike-connected.
 */
export type BluetoothSupportState =
  'ready' | 'unsupported-browser' | 'insecure-context' | 'adapter-off';

/** The browser's support for Web Bluetooth (docs/detailed-designs/bike/check-bike-and-browser-support). */
export interface BluetoothSupport {
  readonly state: Signal<BluetoothSupportState>;
  /** Reads the browser again, after the rider changed something. */
  recheck(): Promise<BluetoothSupportState>;
  /** The current address on `https://`: same host, path, query and fragment. */
  secureUrl(): string;
}

export const BLUETOOTH_SUPPORT = new InjectionToken<BluetoothSupport>('BLUETOOTH_SUPPORT');

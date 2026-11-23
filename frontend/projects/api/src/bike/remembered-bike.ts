import { InjectionToken } from '@angular/core';
import type { BikeInfo } from './bike-connection';

/** The bike this browser paired, kept so Telo Ride can open on Home and reconnect without the chooser (L2-015). */
export interface RememberedBike {
  /** The remembered bike, or `null` when there is none or its record cannot be read. */
  get(): BikeInfo | null;
  /** Remembers the bike, as seen now: the app saves it again each time it connects. */
  save(bike: BikeInfo): void;
  /** When the app last connected the remembered bike (Diagnostics, L2-113 AC4), or `null` when it does not know. */
  lastSeen(): Date | null;
  forget(): void;
}

export const REMEMBERED_BIKE = new InjectionToken<RememberedBike>('REMEMBERED_BIKE');

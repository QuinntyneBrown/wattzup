import { InjectionToken } from '@angular/core';

/**
 * The rider's Google Maps Platform key, kept in this browser only and sent only to Google's Map Tiles API, never to
 * Telo Ride's backend (L2-066 AC3); the next race's scenery panel holds it (AC8).
 */
export interface MapsKey {
  /** The stored key, or `null` when there is none or storage cannot be read. */
  get(): string | null;
  save(key: string): void;
}

export const MAPS_KEY = new InjectionToken<MapsKey>('MAPS_KEY');

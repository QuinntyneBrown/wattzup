import { DOCUMENT, Injectable, inject } from '@angular/core';
import type { BikeInfo, RememberedBike } from '@telo/api';

/** Where the record lives in localStorage. */
export const REMEMBERED_BIKE_KEY = 'telo-ride.bike';

/**
 * The remembered bike as one JSON record in localStorage, read synchronously so the guard can choose Home or Connect
 * Bike at start-up (docs/detailed-designs/bike/connect-a-bike). A record it cannot parse, or storage the browser
 * refuses, counts as no bike.
 */
@Injectable()
export class RememberedBikeStore implements RememberedBike {
  private readonly window = inject(DOCUMENT).defaultView;

  get(): BikeInfo | null {
    try {
      const raw = this.window?.localStorage.getItem(REMEMBERED_BIKE_KEY);
      return raw ? parse(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  save(bike: BikeInfo): void {
    const { id, name, identifier, kind } = bike;
    try {
      this.window?.localStorage.setItem(
        REMEMBERED_BIKE_KEY,
        JSON.stringify({ id, name, identifier, kind, seenAt: new Date().toISOString() }),
      );
    } catch {
      // Storage refused (private mode, quota): the rider picks the bike again next time.
    }
  }

  lastSeen(): Date | null {
    try {
      const raw = this.window?.localStorage.getItem(REMEMBERED_BIKE_KEY);
      const record: unknown = raw ? JSON.parse(raw) : null;
      if (typeof record !== 'object' || record === null) return null;
      // A record saved before slice 25.1 has only when the bike was paired.
      const { seenAt, pairedAt } = record as Record<string, unknown>;
      const at =
        typeof seenAt === 'string' ? seenAt : typeof pairedAt === 'string' ? pairedAt : null;
      const date = at === null ? null : new Date(at);
      return date === null || Number.isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  forget(): void {
    try {
      this.window?.localStorage.removeItem(REMEMBERED_BIKE_KEY);
    } catch {
      // Nothing to forget where storage is refused.
    }
  }
}

function parse(value: unknown): BikeInfo | null {
  if (typeof value !== 'object' || value === null) return null;
  const { id, name, identifier, kind } = value as Record<string, unknown>;
  if (typeof id !== 'string' || !id || typeof name !== 'string') return null;
  if (identifier !== null && typeof identifier !== 'string') return null;
  if (kind !== 'echelon' && kind !== 'ftms') return null;
  return { id, name, identifier, kind };
}

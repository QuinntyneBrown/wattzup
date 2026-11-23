import { DOCUMENT, Injectable, inject } from '@angular/core';
import type { MapsKey } from '@telo/api';

/** Where the key lives in localStorage. */
export const MAPS_KEY_STORAGE = 'telo-ride.maps-key';

/**
 * The rider's Google Maps Platform key in this browser's localStorage (L2-066 AC3, AC8), like the remembered bike.
 * Storage the browser refuses counts as no key, and a key that cannot be saved is asked for again next time.
 */
@Injectable()
export class MapsKeyStore implements MapsKey {
  private readonly window = inject(DOCUMENT).defaultView;

  get(): string | null {
    try {
      const key = this.window?.localStorage.getItem(MAPS_KEY_STORAGE)?.trim();
      return key ? key : null;
    } catch {
      return null;
    }
  }

  save(key: string): void {
    try {
      this.window?.localStorage.setItem(MAPS_KEY_STORAGE, key);
    } catch {
      // Storage refused (private mode, quota): the rider pastes the key again next race.
    }
  }
}

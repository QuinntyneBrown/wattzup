import { DOCUMENT, Injectable, inject } from '@angular/core';

/** Where the record lives in localStorage. */
export const REMEMBERED_STRAP_KEY = 'telo-ride.strap';

/** The strap this browser chose: the browser's id for it, by which `getDevices()` finds it again. */
export interface RememberedStrap {
  readonly id: string;
  readonly name: string;
}

/**
 * The remembered heart-rate strap as one JSON record in localStorage, like the remembered bike
 * (docs/detailed-designs/bike/show-heart-rate). A record it cannot parse, or storage the browser refuses, counts as
 * no strap.
 */
@Injectable()
export class RememberedStrapStore {
  private readonly window = inject(DOCUMENT).defaultView;

  get(): RememberedStrap | null {
    try {
      const raw = this.window?.localStorage.getItem(REMEMBERED_STRAP_KEY);
      const record: unknown = raw ? JSON.parse(raw) : null;
      if (typeof record !== 'object' || record === null) return null;
      const { id, name } = record as Record<string, unknown>;
      return typeof id === 'string' && typeof name === 'string' ? { id, name } : null;
    } catch {
      return null;
    }
  }

  save(strap: RememberedStrap): void {
    try {
      this.window?.localStorage.setItem(
        REMEMBERED_STRAP_KEY,
        JSON.stringify({ id: strap.id, name: strap.name }),
      );
    } catch {
      // Storage refused (private mode, quota): the rider chooses the strap again next time.
    }
  }
}

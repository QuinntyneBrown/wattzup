import { DOCUMENT, Injectable, inject } from '@angular/core';
import type { MapDto } from '@telo/api';

/** Where the kept map catalogue lives in localStorage. */
export const MAP_CATALOGUE_KEY = 'telo-ride.map-catalogue';

/**
 * The last map catalogue the backend served, kept in localStorage so Map Select and a solo or bots race read without a
 * network (L2-135 AC3; ADR 0029). A record it cannot parse, or storage the browser refuses, counts as none.
 */
@Injectable()
export class MapCatalogueCache {
  private readonly window = inject(DOCUMENT).defaultView;

  read(): readonly MapDto[] | null {
    try {
      const raw = this.window?.localStorage.getItem(MAP_CATALOGUE_KEY);
      const value: unknown = raw ? JSON.parse(raw) : null;
      return Array.isArray(value) ? (value as readonly MapDto[]) : null;
    } catch {
      return null;
    }
  }

  save(maps: readonly MapDto[]): void {
    try {
      this.window?.localStorage.setItem(MAP_CATALOGUE_KEY, JSON.stringify(maps));
    } catch {
      // Storage refused (private mode, quota): the catalogue is asked for again next time.
    }
  }
}

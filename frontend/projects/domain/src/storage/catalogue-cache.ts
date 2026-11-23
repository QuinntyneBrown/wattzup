import { DOCUMENT, Injectable, inject } from '@angular/core';
import type { ClassCatalogueDto } from '@telo/api';

/** Where the kept catalogue lives in localStorage. */
export const CATALOGUE_KEY = 'telo-ride.class-catalogue';

/**
 * The last class catalogue the backend served, kept in localStorage so the library and a solo class read without a
 * network (L2-080 AC3, L2-135 AC3; ADR 0028). A record it cannot parse, or storage the browser refuses, counts as none.
 */
@Injectable()
export class CatalogueCache {
  private readonly window = inject(DOCUMENT).defaultView;

  read(): ClassCatalogueDto | null {
    try {
      const raw = this.window?.localStorage.getItem(CATALOGUE_KEY);
      return raw ? parse(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  save(catalogue: ClassCatalogueDto): void {
    try {
      this.window?.localStorage.setItem(CATALOGUE_KEY, JSON.stringify(catalogue));
    } catch {
      // Storage refused (private mode, quota): the catalogue is asked for again next time.
    }
  }
}

function parse(value: unknown): ClassCatalogueDto | null {
  if (typeof value !== 'object' || value === null) return null;
  const { shelves, classes } = value as Record<string, unknown>;
  return Array.isArray(shelves) && Array.isArray(classes) ? (value as ClassCatalogueDto) : null;
}

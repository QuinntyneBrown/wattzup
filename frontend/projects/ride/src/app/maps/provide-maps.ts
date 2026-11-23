import type { Provider } from '@angular/core';
import { HttpMapsApi, MAPS_API } from '@telo/api';
import { CachedMapsApi, MapCatalogueCache } from '@telo/domain';

/**
 * The map catalogue's client for the routes and pages that read it, keeping the last catalogue on the device (ADR 0029).
 */
export function provideMaps(): Provider[] {
  return [HttpMapsApi, MapCatalogueCache, { provide: MAPS_API, useClass: CachedMapsApi }];
}

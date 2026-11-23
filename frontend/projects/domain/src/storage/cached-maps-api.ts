import { Injectable, inject } from '@angular/core';
import { HttpMapsApi, type MapDto, type MapsApi, MapsApiError } from '@telo/api';
import { type Observable, catchError, of, tap, throwError } from 'rxjs';
import { MapCatalogueCache } from './map-catalogue-cache';

/**
 * The `MAPS_API` the app binds (ADR 0029): it asks the backend for the map catalogue and keeps each answer, and when the
 * backend cannot be reached it answers from the kept catalogue (L2-135 AC3), or refuses with `maps_unavailable`.
 */
@Injectable()
export class CachedMapsApi implements MapsApi {
  private readonly http = inject(HttpMapsApi);
  private readonly cache = inject(MapCatalogueCache);

  list(): Observable<readonly MapDto[]> {
    return this.http.list().pipe(
      tap((maps) => this.cache.save(maps)),
      catchError(() => {
        const kept = this.cache.read();
        return kept
          ? of(kept)
          : throwError(
              () => new MapsApiError('maps_unavailable', 'No map catalogue, and none kept'),
            );
      }),
    );
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';

/**
 * How many riders are queuing for a map now (L2-048 AC3, L2-121 AC4), for Race Setup's "Riders online" line. It travels
 * over HTTP, since Race Setup holds no hub connection (L2-120 AC4).
 */
export interface RaceQueueApi {
  riders(mapId: string): Observable<number>;
}

export const RACE_QUEUE_API = new InjectionToken<RaceQueueApi>('RACE_QUEUE_API');

/** The queue's HTTP client: `GET /api/maps/{mapId}/queue`. */
@Injectable()
export class HttpRaceQueueApi implements RaceQueueApi {
  private readonly http = inject(HttpClient);

  riders(mapId: string): Observable<number> {
    return this.http
      .get<{ riders: number }>(`/api/maps/${encodeURIComponent(mapId)}/queue`)
      .pipe(map((queue) => queue.riders));
  }
}

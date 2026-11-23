import { Injectable } from '@angular/core';
import type { GhostApi, GhostTrace } from '@telo/api';
import { type Observable, of } from 'rxjs';

/**
 * `GHOST_API` before rides are recorded (slice 10.1) and a best ride's trace kept (11.2): no map has a best, so the
 * ghost rides the medium pace (L2-050 AC4), and no request is made. `HttpGhostApi` takes its place with the same
 * contract.
 */
@Injectable()
export class NoBestRides implements GhostApi {
  bestRide(): Observable<GhostTrace | null> {
    return of(null);
  }
}

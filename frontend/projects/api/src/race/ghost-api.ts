import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/** The rider's best finished ride on a map: metres ridden at each whole second, from 0 at second 0. */
export type GhostTrace = readonly number[];

/**
 * The rider's best ride on a map, which the ghost of a solo race replays (L2-067 AC2,
 * docs/detailed-designs/race/race-the-ghost-and-bots). `null` when the map has no best, and the ghost rides the medium
 * pace (L2-050 AC4).
 */
export interface GhostApi {
  bestRide(mapId: string): Observable<GhostTrace | null>;
}

export const GHOST_API = new InjectionToken<GhostApi>('GHOST_API');

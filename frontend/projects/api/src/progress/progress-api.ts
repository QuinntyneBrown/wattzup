import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { MapProgressDto } from './map-progress-dto';

/**
 * The rider's progress (L2-044): the rider level, which decides the class tiers open to them (L2-043,
 * docs/detailed-designs/classes/browse-the-class-library), and their maps (docs/detailed-designs/race/browse-maps).
 */
export interface ProgressApi {
  /** The rider level, from 1. */
  level(): Observable<number>;
  /** The maps open to them, the next unlock, and each ridden map's stars and best. */
  maps(): Observable<MapProgressDto>;
}

export const PROGRESS_API = new InjectionToken<ProgressApi>('PROGRESS_API');

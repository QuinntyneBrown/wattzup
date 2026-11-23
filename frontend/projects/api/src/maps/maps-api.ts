import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { MapDto } from './map-dto';

/** The map catalogue (docs/detailed-designs/race/browse-maps), in unlock order. */
export interface MapsApi {
  list(): Observable<readonly MapDto[]>;
}

export const MAPS_API = new InjectionToken<MapsApi>('MAPS_API');

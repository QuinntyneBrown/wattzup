import { InjectionToken, type Signal } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ProgressDto } from './progress-dto';

/** The rider's progress the backend keeps: `GET /api/progress` (L2-044 AC1). */
export interface RiderProgressApi {
  progress(): Observable<ProgressDto>;
  /** Home has announced the map a ride opened, so it is not announced again on any device (L2-036 AC3). */
  markUnlockSeen(mapId: string): Observable<void>;
}

export const RIDER_PROGRESS_API = new InjectionToken<RiderProgressApi>('RIDER_PROGRESS_API');

/**
 * The rider's progress shared by the header and the screens under it (docs/detailed-designs/home/show-the-app-header):
 * `null` until it arrives, or while it cannot be read; `refresh()` reads it again.
 */
export interface ProgressStore {
  readonly progress: Signal<ProgressDto | null>;
  refresh(): void;
}

export const PROGRESS_STORE = new InjectionToken<ProgressStore>('PROGRESS_STORE');

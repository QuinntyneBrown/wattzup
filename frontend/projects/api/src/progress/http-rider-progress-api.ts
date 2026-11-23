import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ProgressDto } from './progress-dto';
import type { RiderProgressApi } from './rider-progress-api';

/**
 * The rider's progress over HTTP, with the session cookie: `GET /api/progress`, and
 * `POST /api/progress/unlocks/{mapId}/seen` once Home has announced a map a ride opened.
 */
@Injectable()
export class HttpRiderProgressApi implements RiderProgressApi {
  private readonly http = inject(HttpClient);

  progress(): Observable<ProgressDto> {
    return this.http.get<ProgressDto>('/api/progress');
  }

  markUnlockSeen(mapId: string): Observable<void> {
    return this.http.post<void>(`/api/progress/unlocks/${encodeURIComponent(mapId)}/seen`, null);
  }
}

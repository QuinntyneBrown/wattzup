import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, firstValueFrom, from, map } from 'rxjs';
import type { MapProgressDto } from './map-progress-dto';
import type { ProgressApi } from './progress-api';
import type { ProgressDto } from './progress-dto';

/**
 * The rider's level and maps from the backend (GET /api/progress, L2-040, L2-041): one request for the route that binds
 * it, made on the first read, its answer shared by both reads, and gone with the route.
 */
@Injectable()
export class HttpProgressApi implements ProgressApi {
  private readonly http = inject(HttpClient);
  private answer: Promise<ProgressDto> | null = null;

  level(): Observable<number> {
    return this.progress().pipe(map((progress) => progress.level));
  }

  maps(): Observable<MapProgressDto> {
    return this.progress().pipe(
      map(({ openMapIds, nextUnlockId, stars, bestTimeSeconds }) => ({
        openMapIds,
        nextUnlockId,
        stars,
        bestTimeSeconds,
      })),
    );
  }

  /** The standing the header shows, with the rider's maps alongside it. */
  private progress(): Observable<ProgressDto> {
    this.answer ??= firstValueFrom(this.http.get<ProgressDto>('/api/progress'));
    return from(this.answer);
  }
}

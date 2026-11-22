import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, catchError, map, of } from 'rxjs';
import type { CustomWorkoutDraft } from './custom-workout';
import type { CustomWorkoutApi } from './custom-workout-api';
import type { Plan } from './plan';

const PATH = '/api/riders/me/custom-workout';

/**
 * The custom workout on the backend: `GET` the settings last saved, any refusal (404 `custom_workout_not_found`, no
 * network) reading as none; `PUT` the draft with its plan's segments, which the backend checks (`plan_invalid`).
 */
@Injectable()
export class HttpCustomWorkoutApi implements CustomWorkoutApi {
  private readonly http = inject(HttpClient);

  load(): Observable<unknown> {
    return this.http.get<{ readonly draft?: unknown }>(PATH).pipe(
      map((saved) => saved?.draft ?? null),
      catchError(() => of(null)),
    );
  }

  save(draft: CustomWorkoutDraft, plan: Plan): Observable<void> {
    return this.http.put<void>(PATH, { draft, segments: plan.segments });
  }
}

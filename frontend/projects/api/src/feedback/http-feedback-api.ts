import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
import type { FeedbackApi, FeedbackRequest } from './feedback';

/** Feedback on the backend: `POST /api/feedback`, answered 201 Created (docs/detailed-designs/feedback/receive-feedback). */
@Injectable()
export class HttpFeedbackApi implements FeedbackApi {
  private readonly http = inject(HttpClient);

  send(request: FeedbackRequest): Observable<void> {
    return this.http.post('/api/feedback', request).pipe(map(() => undefined));
  }
}

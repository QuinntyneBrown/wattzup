import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ClassCatalogueDto } from './class-catalogue-dto';
import type { ClassDto } from './class-dto';
import type { ClassSessionDto, NextGroupSessionDto } from './class-session-dto';

/**
 * The catalogue's HTTP client: `GET /api/classes` and `GET /api/classes/{id}` (ADR 0028), and the group sessions,
 * `GET /api/classes/{id}/sessions` and `GET /api/classes/sessions`. It only asks; the app binds `CLASSES_API` to
 * `CachedClassesApi`, which keeps the catalogue it answers.
 */
@Injectable()
export class HttpClassesApi {
  private readonly http = inject(HttpClient);

  list(): Observable<ClassCatalogueDto> {
    return this.http.get<ClassCatalogueDto>('/api/classes');
  }

  get(id: string): Observable<ClassDto> {
    return this.http.get<ClassDto>(`/api/classes/${encodeURIComponent(id)}`);
  }

  sessions(classId: string): Observable<readonly ClassSessionDto[]> {
    return this.http.get<readonly ClassSessionDto[]>(
      `/api/classes/${encodeURIComponent(classId)}/sessions`,
    );
  }

  nextSessions(): Observable<readonly NextGroupSessionDto[]> {
    return this.http.get<readonly NextGroupSessionDto[]>('/api/classes/sessions');
  }
}

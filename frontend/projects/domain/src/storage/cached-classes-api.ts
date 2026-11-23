import { Injectable, inject } from '@angular/core';
import {
  type ClassCatalogueDto,
  type ClassDto,
  type ClassesApi,
  ClassesApiError,
  type ClassSessionDto,
  type NextGroupSessionDto,
  HttpClassesApi,
} from '@telo/api';
import { type Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { CatalogueCache } from './catalogue-cache';

/**
 * The `CLASSES_API` the app binds (ADR 0028): it asks the backend for the catalogue and keeps each answer, and when the
 * backend cannot be reached it answers from the kept catalogue, so a solo class starts without a network once the app
 * has read it (L2-080 AC3, L2-135 AC3). A class is found in that catalogue, so the class ride keeps it too.
 */
@Injectable()
export class CachedClassesApi implements ClassesApi {
  private readonly http = inject(HttpClassesApi);
  private readonly cache = inject(CatalogueCache);

  list(): Observable<ClassCatalogueDto> {
    return this.http.list().pipe(
      tap((catalogue) => this.cache.save(catalogue)),
      catchError(() => {
        const kept = this.cache.read();
        return kept
          ? of(kept)
          : throwError(
              () => new ClassesApiError('catalogue_unavailable', 'No catalogue, and none kept'),
            );
      }),
    );
  }

  get(id: string): Observable<ClassDto> {
    return this.list().pipe(
      map((catalogue) => {
        const found = catalogue.classes.find((dto) => dto.id === id);
        if (!found) throw new ClassesApiError('class_not_found', `No class ${id} in the catalogue`);
        return found;
      }),
    );
  }

  /** The group sessions are live: asked of the backend each time, and never kept. */
  sessions(classId: string): Observable<readonly ClassSessionDto[]> {
    return this.http.sessions(classId);
  }

  nextSessions(): Observable<readonly NextGroupSessionDto[]> {
    return this.http.nextSessions();
  }
}

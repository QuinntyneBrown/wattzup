import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ClassCatalogueDto } from './class-catalogue-dto';
import type { ClassDto } from './class-dto';
import type { ClassSessionDto, NextGroupSessionDto } from './class-session-dto';

/** The class catalogue (docs/detailed-designs/classes/browse-the-class-library); refuses with a `ClassesApiError`. */
export interface ClassesApi {
  /** The shelves and the classes. */
  list(): Observable<ClassCatalogueDto>;
  /** One class, by id. */
  get(id: string): Observable<ClassDto>;
  /** The class's next two group sessions (L2-085); live, so never kept. Needs a signed-in rider. */
  sessions(classId: string): Observable<readonly ClassSessionDto[]>;
  /** Every class's next group session (L2-083 AC2); live, so never kept. Needs a signed-in rider. */
  nextSessions(): Observable<readonly NextGroupSessionDto[]>;
}

export const CLASSES_API = new InjectionToken<ClassesApi>('CLASSES_API');

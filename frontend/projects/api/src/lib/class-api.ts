// The class catalogue API contract (L2-078, ADR 0014). Components inject CLASS_API, never
// HttpClassApi.
import { InjectionToken } from '@angular/core';
import type { ClassCatalogue, ClassEntry } from './api-types';

export interface ClassApi {
  /** GET /api/classes: every shelf that has a class, with its classes, in file order. */
  list(): Promise<ClassCatalogue>;
  /** GET /api/classes/{id}; 'not-found' for a 404 (class_not_found). */
  get(id: string): Promise<ClassEntry | 'not-found'>;
}

export const CLASS_API = new InjectionToken<ClassApi>('CLASS_API');

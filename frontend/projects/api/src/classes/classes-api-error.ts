/** Why a class could not be read; a screen branches on `code`, the rider reads plain words. */
export type ClassesApiErrorCode = 'class_not_found' | 'catalogue_unavailable';

/**
 * A refusal from `ClassesApi`: `class_not_found` when the catalogue holds no such class, `catalogue_unavailable` when
 * the backend cannot be reached and no catalogue has been kept on the device yet (L2-135 AC3).
 */
export class ClassesApiError extends Error {
  constructor(
    readonly code: ClassesApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ClassesApiError';
  }
}

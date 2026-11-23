import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { CLASSES_API, PROGRESS_API } from '@telo/api';
import { catchError, combineLatest, map, of, take } from 'rxjs';

/**
 * Lets Class Start open only for a class the rider's level has opened (L2-082 AC4): a locked class's address opens the
 * Class Library instead, as does a class the catalogue does not hold, or no catalogue at all, which the library
 * explains.
 */
export const classUnlockedGuard: CanActivateFn = (route) => {
  const library = inject(Router).parseUrl('/classes');
  return combineLatest([
    inject(CLASSES_API).get(route.paramMap.get('id') ?? ''),
    inject(PROGRESS_API).level(),
  ]).pipe(
    take(1),
    map(([dto, level]) => (dto.opensAtLevel <= level ? true : library)),
    catchError(() => of(library)),
  );
};

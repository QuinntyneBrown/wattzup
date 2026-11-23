import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { PROGRESS_API } from '@telo/api';
import { catchError, map, of, take } from 'rxjs';

/**
 * Lets Race Setup and the race open only for a map open to the rider (L2-047 AC5): a locked map's address opens Map
 * Select instead, as does a map the rider's progress does not hold.
 */
export const openMapGuard: CanActivateFn = (route) => {
  const maps = inject(Router).parseUrl('/race');
  const mapId = route.paramMap.get('mapId') ?? '';
  return inject(PROGRESS_API)
    .maps()
    .pipe(
      take(1),
      map((progress) => (progress.openMapIds.includes(mapId) ? true : maps)),
      catchError(() => of(maps)),
    );
};

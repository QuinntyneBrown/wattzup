import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { CURRENT_RIDER } from './current-rider';

/**
 * Reports a 401 from the backend to `CURRENT_RIDER`: the session has ended, so the next screen that needs one opens
 * sign-in (L2-004 AC3). Sign-in's own refusals are not a session ending. The app and the API share an origin
 * (ADR 0026), so the session cookie goes with every request as it is.
 */
export const sessionInterceptor: HttpInterceptorFn = (request, next) => {
  const rider = inject(CURRENT_RIDER);
  return next(request).pipe(
    tap({
      error: (failure: unknown) => {
        if (
          failure instanceof HttpErrorResponse &&
          failure.status === 401 &&
          !new URL(request.url, 'http://app').pathname.startsWith('/api/auth/')
        ) {
          rider.signedOut();
        }
      },
    }),
  );
};

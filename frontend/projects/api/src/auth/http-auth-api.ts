import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, catchError, map, throwError } from 'rxjs';
import { AuthApiError, type AuthApiErrorCode } from './auth-api-error';
import type { AuthApi, ConfirmCodeResult } from './auth-api';

const SEND_CODES: readonly AuthApiErrorCode[] = [
  'invalid_email',
  'rate_limited',
  'resend_too_soon',
];
const CHECK_CODES: readonly AuthApiErrorCode[] = [
  'invalid_email',
  'code_mismatch',
  'code_expired',
  'code_locked',
];

/**
 * Sign-in's HTTP client: `POST /api/auth/code`, `POST /api/auth/code/confirm` and `POST /api/auth/sign-out` (ADR 0025).
 */
@Injectable()
export class HttpAuthApi implements AuthApi {
  private readonly http = inject(HttpClient);

  sendCode(email: string): Observable<void> {
    return this.http.post('/api/auth/code', { email }).pipe(
      map(() => undefined),
      catchError((failure: unknown) =>
        throwError(() => refusal(failure, SEND_CODES, 'send_failed')),
      ),
    );
  }

  confirmCode(email: string, code: string): Observable<ConfirmCodeResult> {
    return this.http
      .post<ConfirmCodeResult>('/api/auth/code/confirm', { email, code })
      .pipe(
        catchError((failure: unknown) =>
          throwError(() => refusal(failure, CHECK_CODES, 'check_failed')),
        ),
      );
  }

  signOut(): Observable<void> {
    return this.http.post('/api/auth/sign-out', null).pipe(map(() => undefined));
  }
}

/**
 * A refusal as sign-in's screens branch on it: the backend's `code` when it is one this request can have, `otherwise`
 * for anything else (no network, a 500), and `Retry-After` in seconds for a 429.
 */
function refusal(
  failure: unknown,
  known: readonly AuthApiErrorCode[],
  otherwise: AuthApiErrorCode,
): AuthApiError {
  if (!(failure instanceof HttpErrorResponse)) {
    return new AuthApiError(otherwise, null, 'The request got no answer.');
  }
  const body: unknown = failure.error;
  const said =
    typeof body === 'object' && body !== null && 'code' in body ? String(body.code) : null;
  const code = known.find((one) => one === said) ?? otherwise;
  const retryAfter = Number(failure.headers.get('Retry-After'));
  return new AuthApiError(
    code,
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
    `Sign-in was refused (${failure.status}).`,
  );
}

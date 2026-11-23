import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Sign-in with an email code (docs/detailed-designs/accounts/sign-in-with-an-email-code). A refusal errors with an
 * `AuthApiError`.
 */
export interface AuthApi {
  /** Asks the backend to email a six-digit code to `email`; completes once it has been sent (202). */
  sendCode(email: string): Observable<void>;
  /** Confirms the six digits sent to `email`; the backend starts a session with its cookie (L2-002 AC2, L2-004). */
  confirmCode(email: string, code: string): Observable<ConfirmCodeResult>;
  /** Ends this device's session on the backend and clears its cookie; completes once it has (204, L2-006 AC1). */
  signOut(): Observable<void>;
}

/** The rider a confirmed code signed in; `isNewAccount` when the address had none (L2-001 AC4). */
export interface ConfirmCodeResult {
  readonly riderId: string;
  readonly displayName: string | null;
  readonly isNewAccount: boolean;
}

export const AUTH_API = new InjectionToken<AuthApi>('AUTH_API');

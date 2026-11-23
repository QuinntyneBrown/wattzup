import type { SignInError } from '@telo/api';

/**
 * The words the sign-in screens show for a refusal (L2-001 AC5, L2-003 AC4), or null when the refusal has its own place:
 * an invalid address is marked under its field, and a code sent moments ago shows as the countdown.
 */
export function signInMessage(error: SignInError | null): string | null {
  switch (error?.code) {
    case 'send_failed':
      return 'We couldn’t send your code. Check your connection and try again.';
    case 'rate_limited': {
      const minutes = Math.max(1, Math.ceil((error.retryAfterSeconds ?? 3600) / 60));
      return `Too many codes asked for. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`;
    }
    default:
      return null;
  }
}

/** The words under the code's cells for a code that was refused or could not be checked (L2-002 AC3, AC4, L2-003 AC3). */
export function codeRefusal(error: SignInError | null): string | null {
  switch (error?.code) {
    case 'code_mismatch':
      return 'That code doesn’t match. Try again.';
    case 'code_expired':
      return 'That code has expired.';
    case 'code_locked':
      return 'Too many wrong codes. Send a new code to try again.';
    case 'check_failed':
      return 'We couldn’t check your code. Check your connection and try again.';
    default:
      return null;
  }
}

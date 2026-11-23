import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AUTH_API, AuthApiError, CURRENT_RIDER, type SignInError, TICKER } from '@telo/api';
import { isEmailAddress } from '@telo/domain';
import { type Subscription, firstValueFrom } from 'rxjs';

/** The least time between two codes, as the backend keeps it (L2-003 AC1). */
export const RESEND_SECONDS = 30;

/**
 * Sign-in's state, provided on the sign-in routes (docs/detailed-designs/accounts/sign-in-with-an-email-code): the
 * email typed, where the code went, the busy flag, the last refusal, the resend countdown on `TICKER`'s beat and the
 * screen to return to once the code is confirmed.
 */
@Injectable()
export class SignInStore {
  private readonly auth = inject(AUTH_API);
  private readonly beat = inject(TICKER);
  private readonly currentRider = inject(CURRENT_RIDER);
  private readonly destroyRef = inject(DestroyRef);
  private countdown: Subscription | null = null;

  /** The email as last typed, kept when the rider comes back to change it. */
  readonly email = signal('');
  /** The address the code went to, once one was sent; the code screen opens only then. */
  readonly sentTo = signal<string | null>(null);
  readonly sending = signal(false);
  readonly error = signal<SignInError | null>(null);
  readonly resendSecondsLeft = signal(0);
  /** A new code was sent from the code screen. */
  readonly resent = signal(false);
  /** How many codes were refused; each clears the code's field (L2-002 AC3). */
  readonly refusals = signal(0);
  /** Where a confirmed rider goes: the screen they asked for, or Home (L2-001 AC1, L2-002 AC2). */
  readonly returnUrl = signal('/');

  /** Keeps the screen the guard sent the visitor from; anything but a path of this app's is Home. */
  returnTo(url: string | null | undefined): void {
    this.returnUrl.set(
      url?.startsWith('/') && !url.startsWith('//') && !url.startsWith('/sign-in') ? url : '/',
    );
  }

  /**
   * Confirms the six digits sent to the address (L2-002 AC2): resolves true once the rider is signed in, and otherwise
   * keeps why and counts the refusal (AC3, AC4, L2-003 AC3).
   */
  async confirm(code: string): Promise<boolean> {
    const email = this.sentTo();
    if (email === null || this.sending()) {
      return false;
    }
    this.sending.set(true);
    this.error.set(null);
    this.resent.set(false);
    try {
      const rider = await firstValueFrom(this.auth.confirmCode(email, code));
      this.currentRider.signedIn({ id: rider.riderId, displayName: rider.displayName });
      return true;
    } catch (failure) {
      this.error.set(
        failure instanceof AuthApiError
          ? { code: failure.code, retryAfterSeconds: failure.retryAfterSeconds }
          : { code: 'check_failed', retryAfterSeconds: null },
      );
      this.refusals.update((count) => count + 1);
      return false;
    } finally {
      this.sending.set(false);
    }
  }

  /**
   * Sends a code to `typed` (L2-001 AC2). An address that is not one sends nothing (AC3). Resolves true when the code
   * screen should open: the code was sent, or one was sent moments ago and is on its way.
   */
  async send(typed: string): Promise<boolean> {
    this.email.set(typed);
    if (!isEmailAddress(typed)) {
      this.error.set({ code: 'invalid_email', retryAfterSeconds: null });
      return false;
    }
    const email = typed.trim();
    const sent = await this.request(email);
    if (sent) {
      this.sentTo.set(email);
      this.resent.set(false);
    }
    return sent;
  }

  /** Sends a new code to the same address once the countdown is over (L2-003 AC2). */
  async resend(): Promise<void> {
    const email = this.sentTo();
    if (email === null || this.resendSecondsLeft() > 0 || this.sending()) {
      return;
    }
    this.resent.set(await this.request(email));
  }

  /** Back to sign-in to type another address: its refusals go with the screen. */
  changeEmail(): void {
    this.error.set(null);
    this.resent.set(false);
  }

  private async request(email: string): Promise<boolean> {
    this.sending.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.auth.sendCode(email));
      this.countDown(RESEND_SECONDS);
      return true;
    } catch (failure) {
      const refusal: SignInError =
        failure instanceof AuthApiError
          ? failure
          : { code: 'send_failed', retryAfterSeconds: null };
      if (refusal.code === 'resend_too_soon') {
        this.countDown(refusal.retryAfterSeconds ?? RESEND_SECONDS);
        return true;
      }
      this.error.set({ code: refusal.code, retryAfterSeconds: refusal.retryAfterSeconds });
      return false;
    } finally {
      this.sending.set(false);
    }
  }

  private countDown(seconds: number): void {
    this.countdown?.unsubscribe();
    this.resendSecondsLeft.set(seconds);
    this.countdown = this.beat.seconds.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const left = Math.max(0, this.resendSecondsLeft() - 1);
      this.resendSecondsLeft.set(left);
      if (left === 0) {
        this.countdown?.unsubscribe();
        this.countdown = null;
      }
    });
  }
}

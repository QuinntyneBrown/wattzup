import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AUTH_API, CURRENT_RIDER, RIDERS_API } from '@telo/api';
import { firstValueFrom } from 'rxjs';

/**
 * Signs this device out and deletes the account (docs/detailed-designs/accounts/sign-out-and-delete-an-account),
 * provided by the Profile route so sign-in's client stays out of the initial bundle. Each keeps whether it is under way
 * and whether it failed; either tells `CURRENT_RIDER` the rider signed out once the backend has answered (L2-006).
 */
@Injectable()
export class AccountStore {
  private readonly auth = inject(AUTH_API);
  private readonly riders = inject(RIDERS_API);
  private readonly currentRider = inject(CURRENT_RIDER);
  private readonly router = inject(Router);

  readonly signingOut = signal(false);
  readonly signOutFailed = signal(false);
  readonly deleting = signal(false);
  readonly deleteFailed = signal(false);

  /** Ends this device's session, then opens sign-in (AC1); if the backend cannot be reached, the rider stays in. */
  async signOut(): Promise<void> {
    if (this.signingOut()) {
      return;
    }
    this.signingOut.set(true);
    this.signOutFailed.set(false);
    try {
      await firstValueFrom(this.auth.signOut());
    } catch {
      this.signOutFailed.set(true);
      return;
    } finally {
      this.signingOut.set(false);
    }
    this.currentRider.signedOut();
    await this.router.navigateByUrl('/sign-in');
  }

  /** Deletes the account; true once the backend has, after which the rider is signed out (AC3). */
  async deleteAccount(): Promise<boolean> {
    if (this.deleting()) {
      return false;
    }
    this.deleting.set(true);
    this.deleteFailed.set(false);
    try {
      await firstValueFrom(this.riders.deleteMe());
    } catch {
      this.deleteFailed.set(true);
      return false;
    } finally {
      this.deleting.set(false);
    }
    this.currentRider.signedOut();
    return true;
  }

  /** Opens sign-in, which says the account was deleted (AC3). */
  async showDeleted(): Promise<void> {
    await this.router.navigateByUrl('/sign-in', { state: { accountDeleted: true } });
  }
}

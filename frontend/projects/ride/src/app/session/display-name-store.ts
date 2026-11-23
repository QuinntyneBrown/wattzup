import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { CURRENT_RIDER, RIDERS_API, isDisplayName } from '@telo/api';
import { firstValueFrom } from 'rxjs';

/** Why a name was not saved: the backend refused it, or the save got no answer of its own. */
export type DisplayNameError = 'refused' | 'failed';

/**
 * Saves the display name (docs/detailed-designs/accounts/choose-a-display-name), provided by the prompt's route and by
 * Profile's dialog: it keeps whether a save is under way, why the last one failed and how many names were refused, and
 * tells `CURRENT_RIDER` the new name, so every screen shows it at once. A name that breaks the rule is refused at once,
 * without asking the backend, whose rule decides the rest (L2-005 AC2).
 */
@Injectable()
export class DisplayNameStore {
  private readonly riders = inject(RIDERS_API);
  private readonly currentRider = inject(CURRENT_RIDER);

  readonly saving = signal(false);
  readonly error = signal<DisplayNameError | null>(null);
  /** How many names were refused for breaking the rule. */
  readonly refusals = signal(0);

  /** Saves `name`; resolves true once the backend kept it (L2-005 AC2). */
  async save(name: string): Promise<boolean> {
    if (this.saving()) {
      return false;
    }
    if (!isDisplayName(name)) {
      this.refuse();
      return false;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      this.currentRider.signedIn(await firstValueFrom(this.riders.setDisplayName(name)));
      return true;
    } catch (failure) {
      if (refused(failure)) {
        this.refuse();
      } else {
        this.error.set('failed');
      }
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  private refuse(): void {
    this.error.set('refused');
    this.refusals.update((count) => count + 1);
  }
}

function refused(failure: unknown): boolean {
  const body: unknown = failure instanceof HttpErrorResponse ? failure.error : null;
  return (
    failure instanceof HttpErrorResponse &&
    failure.status === 400 &&
    typeof body === 'object' &&
    body !== null &&
    'code' in body &&
    body.code === 'display_name_invalid'
  );
}

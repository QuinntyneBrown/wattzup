import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { type CurrentRider, RIDERS_API, type RiderMe, type RiderStatus } from '@telo/api';
import { firstValueFrom } from 'rxjs';

/**
 * The current rider for every screen (docs/detailed-designs/accounts/stay-signed-in), behind `CURRENT_RIDER`: it asks
 * `GET /api/riders/me` once, and learns of a sign-in from the code screen and of a session ending from any 401.
 */
@Injectable()
export class CurrentRiderStore implements CurrentRider {
  private readonly riders = inject(RIDERS_API);
  private asking: Promise<RiderStatus> | null = null;

  readonly status = signal<RiderStatus>('unknown');
  readonly rider = signal<RiderMe | null>(null);

  load(): Promise<RiderStatus> {
    if (this.status() !== 'unknown') {
      return Promise.resolve(this.status());
    }
    this.asking ??= this.ask();
    return this.asking;
  }

  signedIn(rider: RiderMe): void {
    this.rider.set(rider);
    this.status.set('signedIn');
  }

  signedOut(): void {
    this.rider.set(null);
    this.status.set('signedOut');
  }

  private async ask(): Promise<RiderStatus> {
    try {
      this.signedIn(await firstValueFrom(this.riders.me()));
    } catch (failure) {
      if (failure instanceof HttpErrorResponse && failure.status === 401) {
        this.signedOut();
      } else if (this.status() === 'unknown') {
        this.status.set('unreachable');
      }
    } finally {
      this.asking = null;
    }
    return this.status();
  }
}

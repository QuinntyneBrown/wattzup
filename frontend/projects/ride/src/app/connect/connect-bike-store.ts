import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  BIKE_CONNECTION,
  BikeConnectionError,
  REMEMBERED_BIKE,
  type BikeConnectionErrorCode,
  type BikeInfo,
} from '@telo/api';

/** Where Connect Bike stands (docs/detailed-designs/bike/connect-a-bike). */
export type ConnectView =
  | { readonly kind: 'default' }
  | { readonly kind: 'searching' }
  | { readonly kind: 'pairing'; readonly bike: BikeInfo }
  | { readonly kind: 'paired'; readonly bike: BikeInfo }
  | { readonly kind: 'failed'; readonly reason: BikeConnectionErrorCode };

/** How long the paired card shows before Home (the mock's half a second). */
export const PAIRED_PAUSE_MS = 500;

/**
 * Connect Bike's state, provided on the `/connect` route so it goes when the rider leaves. `pair()` runs from the
 * rider's click, because the browser opens its chooser only for a user gesture; Try again after a failure is a click
 * too.
 */
@Injectable()
export class ConnectBikeStore {
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly router = inject(Router);
  private readonly remembered = inject(REMEMBERED_BIKE);
  private readonly state = signal<ConnectView>({ kind: 'default' });
  private leaving: ReturnType<typeof setTimeout> | undefined;

  readonly view = this.state.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.leaving));
  }

  async pair(): Promise<void> {
    const kind = this.state().kind;
    if (kind !== 'default' && kind !== 'failed') return;
    this.state.set({ kind: 'searching' });
    try {
      const bike = await this.connection.requestBike();
      if (!bike) {
        this.state.set({ kind: 'default' });
        return;
      }
      this.state.set({ kind: 'pairing', bike });
      await this.connection.connect();
      this.remembered.save(bike);
      this.state.set({ kind: 'paired', bike });
      this.leaving = setTimeout(() => void this.router.navigateByUrl('/'), PAIRED_PAUSE_MS);
    } catch (error) {
      this.state.set({
        kind: 'failed',
        reason: error instanceof BikeConnectionError ? error.code : 'failed',
      });
    }
  }
}

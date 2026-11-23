import { Injectable, signal } from '@angular/core';
import type { RideActivity } from '@telo/api';

/** Whether a ride is in progress, as the ride screens tell it (L2-150 AC2). */
@Injectable()
export class RideInProgress implements RideActivity {
  private readonly riding = signal(false);
  readonly inProgress = this.riding.asReadonly();

  begin(): void {
    this.riding.set(true);
  }

  end(): void {
    this.riding.set(false);
  }
}

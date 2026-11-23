import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { type ProgressDto, type ProgressStore, RIDER_PROGRESS_API } from '@telo/api';
import type { Subscription } from 'rxjs';

/**
 * The rider's progress from `GET /api/progress` (L2-044 AC1), shared by the header and the screens under it. Each
 * refresh reads it again and drops a read still under way; while it cannot be read it holds nothing, so the header shows
 * no level rather than an old one.
 */
@Injectable()
export class RiderProgressStore implements ProgressStore {
  private readonly api = inject(RIDER_PROGRESS_API);
  private readonly state = signal<ProgressDto | null>(null);
  private reading: Subscription | null = null;

  readonly progress = this.state.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.reading?.unsubscribe());
  }

  refresh(): void {
    this.reading?.unsubscribe();
    this.reading = this.api.progress().subscribe({
      next: (progress) => this.state.set(progress),
      error: () => this.state.set(null),
    });
  }
}

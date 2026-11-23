import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import type { AppUpdates } from '@telo/api';

/**
 * New versions from the Angular service worker (L2-150 AC2, ADR 0032): ready once the worker has downloaded the next
 * version (`VERSION_READY`), or when the loaded version can no longer run because the worker lost its files
 * (`unrecoverable`). Reload switches to the new version and loads the app again; nothing reloads it otherwise.
 */
@Injectable()
export class SwAppUpdates implements AppUpdates {
  private readonly worker = inject(SwUpdate);
  private readonly document = inject(DOCUMENT);
  private readonly found = signal(false);
  readonly ready = this.found.asReadonly();

  constructor() {
    if (!this.worker.isEnabled) return;
    const versions = this.worker.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') this.found.set(true);
    });
    const broken = this.worker.unrecoverable.subscribe(() => this.found.set(true));
    inject(DestroyRef).onDestroy(() => {
      versions.unsubscribe();
      broken.unsubscribe();
    });
  }

  async reload(): Promise<void> {
    // A worker that cannot switch (it lost the version, or another tab switched first) still serves the newest version
    // to the load that follows.
    if (this.worker.isEnabled) await this.worker.activateUpdate().catch(() => false);
    this.document.location.reload();
  }
}

import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';
import type { NetworkStatus } from '@telo/api';

/**
 * `NetworkStatus` from the browser: `navigator.onLine`, kept by the window's `online` and `offline` events (L2-135 AC4).
 * Stops listening when its owner is destroyed.
 */
@Injectable()
export class BrowserNetworkStatus implements NetworkStatus {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly state = signal(this.window?.navigator.onLine ?? true);

  readonly online = this.state.asReadonly();

  constructor() {
    this.window?.addEventListener('online', this.onChange);
    this.window?.addEventListener('offline', this.onChange);
    inject(DestroyRef).onDestroy(() => {
      this.window?.removeEventListener('online', this.onChange);
      this.window?.removeEventListener('offline', this.onChange);
    });
  }

  private readonly onChange = (): void => this.state.set(this.window?.navigator.onLine ?? true);
}

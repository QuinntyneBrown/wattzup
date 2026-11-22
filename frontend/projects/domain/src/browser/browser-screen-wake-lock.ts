import { DOCUMENT, DestroyRef, Injectable, inject } from '@angular/core';
import { RIDE_SETTINGS, type ScreenWakeLock } from '@telo/api';

/**
 * `ScreenWakeLock` on the Screen Wake Lock API (`navigator.wakeLock`). The browser lets a lock go whenever the tab is
 * hidden, so while held it asks again each time the tab becomes visible (L2-133 AC3). Without the API, or when the
 * browser refuses, the screen simply follows the device's own setting. With Settings' "Keep the screen awake" off it
 * asks for nothing (L2-164 AC5). Released when its owner is destroyed.
 */
@Injectable()
export class BrowserScreenWakeLock implements ScreenWakeLock {
  private readonly document = inject(DOCUMENT);
  private readonly settings = inject(RIDE_SETTINGS).settings;
  private sentinel: WakeLockSentinel | null = null;
  private held = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.release());
  }

  hold(): void {
    if (this.held || !this.settings().keepAwake) return;
    this.held = true;
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.request();
  }

  release(): void {
    if (!this.held) return;
    this.held = false;
    this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
    void this.sentinel?.release();
    this.sentinel = null;
  }

  private readonly onVisibilityChange = (): void => {
    if (this.document.visibilityState === 'visible') this.request();
  };

  private request(): void {
    const wakeLock = this.document.defaultView?.navigator.wakeLock;
    if (!wakeLock) return;
    wakeLock.request('screen').then(
      (sentinel) => {
        if (this.held) this.sentinel = sentinel;
        else void sentinel.release();
      },
      () => undefined,
    );
  }
}

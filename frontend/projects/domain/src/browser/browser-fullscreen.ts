import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';
import type { Fullscreen } from '@telo/api';

/**
 * `Fullscreen` on the Fullscreen API: the whole page across the display (L2-144). Available only where the browser
 * offers it (AC2). `active` follows `fullscreenchange`, so it stays true to the browser when the rider leaves with Esc
 * or a refused request changes nothing. Stops listening when its owner is destroyed.
 */
@Injectable()
export class BrowserFullscreen implements Fullscreen {
  private readonly document = inject(DOCUMENT);
  private readonly shown = signal(this.document.fullscreenElement != null);

  readonly available = signal(this.document.fullscreenEnabled === true).asReadonly();
  readonly active = this.shown.asReadonly();

  constructor() {
    this.document.addEventListener('fullscreenchange', this.onChange);
    inject(DestroyRef).onDestroy(() =>
      this.document.removeEventListener('fullscreenchange', this.onChange),
    );
  }

  enter(): void {
    this.document.documentElement.requestFullscreen().catch(() => undefined);
  }

  exit(): void {
    this.document.exitFullscreen().catch(() => undefined);
  }

  private readonly onChange = (): void => this.shown.set(this.document.fullscreenElement != null);
}

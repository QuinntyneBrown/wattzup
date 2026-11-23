import { DOCUMENT } from '@angular/common';
import { Injectable, type OnDestroy, inject } from '@angular/core';
import type { Announcer } from '@telo/api';

/** How long the region stays empty before it takes the words, so a screen reader hears a repeat as a change. */
const BEAT_MS = 100;

/**
 * The announcer (L2-141 AC2): one polite, visually hidden live region of its own, added to the page on first use and
 * removed with the app. Not the CDK's `LiveAnnouncer`, whose sanitizer would join the initial bundle (design open
 * question 1).
 */
@Injectable()
export class LiveRegionAnnouncer implements Announcer, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private region: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  announce(message: string): void {
    const region = (this.region ??= this.create());
    region.textContent = '';
    clearTimeout(this.timer);
    this.timer = setTimeout(() => (region.textContent = message), BEAT_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
    this.region?.remove();
  }

  private create(): HTMLElement {
    const region = this.document.createElement('div');
    region.className = 'live-announcer visually-hidden';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    this.document.body.append(region);
    return region;
  }
}

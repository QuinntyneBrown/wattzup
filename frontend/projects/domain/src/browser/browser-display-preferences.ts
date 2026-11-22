import { DOCUMENT, DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { type DisplayPreferences, RIDE_SETTINGS } from '@telo/api';

/**
 * `DisplayPreferences` in the browser: reads the ride settings and this device's media queries, and marks `<html>` with
 * `data-theme`, `data-motion` (`reduced` or `full`) and `data-ride-numbers`, which the tokens honour, so a choice
 * applies to every screen at once (L2-164 AC2 to AC4). Stops listening when its owner is destroyed.
 */
@Injectable()
export class BrowserDisplayPreferences implements DisplayPreferences {
  private readonly document = inject(DOCUMENT);
  private readonly settings = inject(RIDE_SETTINGS).settings;
  private readonly destroyRef = inject(DestroyRef);

  readonly deviceReducesMotion = this.media('(prefers-reduced-motion: reduce)');
  private readonly deviceAsksLight = this.media('(prefers-color-scheme: light)');

  readonly reducedMotion = computed(() => {
    const choice = this.settings().reduceMotion;
    return choice === 'device' ? this.deviceReducesMotion() : choice === 'on';
  });

  readonly theme = computed<'dark' | 'light'>(() => {
    const choice = this.settings().theme;
    if (choice !== 'device') return choice;
    return this.deviceAsksLight() ? 'light' : 'dark';
  });

  constructor() {
    const html = this.document.documentElement;
    effect(() => {
      html.dataset['theme'] = this.theme();
      html.dataset['motion'] = this.reducedMotion() ? 'reduced' : 'full';
      html.dataset['rideNumbers'] = this.settings().rideNumbers;
    });
  }

  /** Whether `query` matches now, kept by its `change` events. */
  private media(query: string) {
    const list = this.document.defaultView?.matchMedia?.(query) ?? null;
    const matches = signal(list?.matches ?? false);
    const onChange = (event: MediaQueryListEvent) => matches.set(event.matches);
    list?.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => list?.removeEventListener('change', onChange));
    return matches.asReadonly();
  }
}

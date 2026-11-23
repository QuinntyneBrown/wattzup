import { InjectionToken, type Signal } from '@angular/core';

/** Shows the app across the whole display (L2-144), where the browser offers the Fullscreen API. */
export interface Fullscreen {
  /** Whether the browser can show the app in full screen; the header leaves Full screen out where it cannot (AC2). */
  readonly available: Signal<boolean>;
  /** Whether the app is in full screen now, however it got there or left. */
  readonly active: Signal<boolean>;
  enter(): void;
  exit(): void;
}

export const FULLSCREEN = new InjectionToken<Fullscreen>('FULLSCREEN');

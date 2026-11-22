import { InjectionToken, type Signal } from '@angular/core';

/**
 * Motion and display as the app applies them (L2-164 AC2 to AC4): the rider's choices from the ride settings, with
 * Match device resolved from what this device asks for. Every screen, and the world, reads motion from here.
 */
export interface DisplayPreferences {
  /** Whether this device asks for reduced motion (`prefers-reduced-motion: reduce`). */
  readonly deviceReducesMotion: Signal<boolean>;
  /** Reduce motion as the app applies it: the rider's On or Off, else this device's wish (AC2). */
  readonly reducedMotion: Signal<boolean>;
  /** The theme in use: the rider's Dark or Light, else dark unless this device asks for light (AC3). */
  readonly theme: Signal<'dark' | 'light'>;
}

export const DISPLAY_PREFERENCES = new InjectionToken<DisplayPreferences>('DISPLAY_PREFERENCES');

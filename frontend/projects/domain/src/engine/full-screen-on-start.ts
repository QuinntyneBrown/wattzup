import type { Fullscreen, RideSettings } from '@telo/api';

/**
 * A ride's start press (Start riding, Join, or the race's start) enters full screen when the rider asked for it in
 * Settings and the browser can, inside the press, which gives the Fullscreen API the user activation it needs
 * (L2-164 AC6, L2-144).
 */
export function enterFullScreenOnStart(settings: RideSettings, fullscreen: Fullscreen): void {
  if (settings.fullScreenOnStart && fullscreen.available() && !fullscreen.active()) {
    fullscreen.enter();
  }
}

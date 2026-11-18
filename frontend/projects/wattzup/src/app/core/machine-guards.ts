// Pages for one machine only. Not a route guard: a guard would have to wait for the live state,
// which may never come; the page redirects as soon as the state names the other machine
// (as the machine page does, treadmill/choose-machine).
import { effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LiveStateService } from './live-state.service';

/** Sends the treadmill from a bike-only page to `/setup`, replacing the history entry (L2-079 AC12). */
export function bikeOnly(): void {
  const live = inject(LiveStateService);
  const router = inject(Router);
  live.ensureStarted();
  effect(() => {
    if (live.state()?.machine === 'treadmill') {
      void router.navigateByUrl('/setup', { replaceUrl: true });
    }
  });
}

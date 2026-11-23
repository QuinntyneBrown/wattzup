import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { BIKE_CONNECTION, REMEMBERED_BIKE } from '@telo/api';

/**
 * Starts reconnecting to the bike the browser remembers, without the chooser and without waiting, and lets the screen
 * open whether there is one or not (L2-015 AC1): Custom workout and its ride, which show the bike's status.
 */
export const reconnectRememberedBikeGuard: CanActivateFn = () => {
  const remembered = inject(REMEMBERED_BIKE).get();
  if (remembered) void inject(BIKE_CONNECTION).reconnectRemembered(remembered);
  return true;
};

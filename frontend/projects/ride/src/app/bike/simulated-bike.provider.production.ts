import type { Provider } from '@angular/core';

/** The production build's stand-in for `simulated-bike.provider.ts`: no simulator, so `?simulate` is ignored. */
export const SIMULATOR_ENABLED = false;

export function simulatedBike(): Provider[] {
  return [];
}

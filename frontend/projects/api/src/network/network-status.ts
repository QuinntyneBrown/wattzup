import { InjectionToken, type Signal } from '@angular/core';

/** Whether the browser has a network, so a screen can say why a ride with other people cannot be joined (L2-135 AC4). */
export interface NetworkStatus {
  /** `navigator.onLine`, kept by the window's `online` and `offline` events. */
  readonly online: Signal<boolean>;
}

export const NETWORK_STATUS = new InjectionToken<NetworkStatus>('NETWORK_STATUS');

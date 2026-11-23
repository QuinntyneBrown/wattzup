import { InjectionToken, type Signal } from '@angular/core';

/**
 * How the bike link has gone since the bike last connected from scratch: when it connected, and how often it dropped
 * and came back since (Diagnostics' Connection and Reconnects, L2-113 AC2).
 */
export interface ConnectionHistory {
  /** When the link connected, in milliseconds since the epoch; `null` while it is not connected. */
  readonly connectedSince: Signal<number | null>;
  readonly reconnects: Signal<number>;
}

export const CONNECTION_HISTORY = new InjectionToken<ConnectionHistory>('CONNECTION_HISTORY');

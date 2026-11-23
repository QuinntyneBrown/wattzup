import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/** A beat once a second; tests bind a fake they advance by hand, so nothing sleeps (AGENTS.md). */
export interface Ticker {
  /** Emits once a second, counting from 1, while subscribed. */
  readonly seconds: Observable<number>;
}

export const TICKER = new InjectionToken<Ticker>('TICKER');

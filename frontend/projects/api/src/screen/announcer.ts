import { InjectionToken } from '@angular/core';

/**
 * What a screen reader hears beyond the page itself (L2-141 AC2): a state change, said once as it happens: a ride's
 * step as it starts, the result as Results opens. Never a value that changes every second; a countdown is a timer.
 */
export interface Announcer {
  /** Says `message` politely, after what the screen reader is saying now. */
  announce(message: string): void;
}

export const ANNOUNCER = new InjectionToken<Announcer>('ANNOUNCER');

import { InjectionToken, type Signal } from '@angular/core';

/** How a fact reads beside the others: fine, worth a look, or wrong; the words always say it too. */
export type DiagnosticsTone = 'ok' | 'warn' | 'bad';

/** One labelled value in Diagnostics, such as Browser "Chrome 126 · macOS 14.5" (L2-113 AC2). */
export interface DiagnosticsFact {
  readonly term: string;
  readonly value: string;
  readonly tone?: DiagnosticsTone;
}

/**
 * What Diagnostics shows of the browser, Web Bluetooth, the bike link and the app, read in the browser and kept on the
 * device (docs/detailed-designs/diagnostics/inspect-diagnostics).
 */
export interface Diagnostics {
  readonly facts: Signal<readonly DiagnosticsFact[]>;
}

export const DIAGNOSTICS = new InjectionToken<Diagnostics>('DIAGNOSTICS');

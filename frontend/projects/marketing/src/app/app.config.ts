import type { ApplicationConfig } from '@angular/core';
import {
  InjectionToken,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { environment } from '../environments/environment';

/** The address of the Telo Ride app; every link to the app is built from it (ADR 0027). */
export const APP_URL = new InjectionToken<string>('APP_URL');

/**
 * Composition root. The site has no router, no session and no HTTP client: it calls no backend and
 * never talks to the bike (ADR 0027).
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    { provide: APP_URL, useValue: environment.appUrl },
  ],
};

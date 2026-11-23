import {
  ApplicationRef,
  DOCUMENT,
  DestroyRef,
  EnvironmentInjector,
  type EnvironmentProviders,
  createComponent,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { APP_UPDATES, RIDE_ACTIVITY } from '@telo/api';
import { RideInProgress } from '@telo/domain';
import { APP_CACHE_WORKER } from '../app-cache/provide-app-cache';
import { SwAppUpdates } from './sw-app-updates';
import { UpdatePrompt } from './update-prompt';

/**
 * Offers each new version between rides (L2-150 AC2, ADR 0032): Angular's `SwUpdate` and its channel to the worker,
 * whether a ride is in progress, and the update prompt at the foot of every screen. Bound on the screens' lazy parent
 * route, out of the initial bundle. `provideServiceWorker` registers nothing here: its app initializer runs only in the
 * root injector, and `provideAppCache` registers the worker.
 */
export function provideAppUpdates(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideServiceWorker(APP_CACHE_WORKER, { enabled: !isDevMode() }),
    { provide: APP_UPDATES, useClass: SwAppUpdates },
    { provide: RIDE_ACTIVITY, useClass: RideInProgress },
    provideEnvironmentInitializer(() => {
      const prompt = createComponent(UpdatePrompt, {
        environmentInjector: inject(EnvironmentInjector),
      });
      const app = inject(ApplicationRef);
      app.attachView(prompt.hostView);
      inject(DOCUMENT).body.appendChild(prompt.location.nativeElement);
      inject(DestroyRef).onDestroy(() => prompt.destroy());
    }),
  ]);
}

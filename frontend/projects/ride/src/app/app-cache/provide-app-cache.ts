import {
  ApplicationRef,
  DestroyRef,
  type EnvironmentProviders,
  InjectionToken,
  inject,
  isDevMode,
  provideEnvironmentInitializer,
} from '@angular/core';

/** The Angular service worker the production build writes beside the app (`ngsw-config.json`). */
export const APP_CACHE_WORKER = 'ngsw-worker.js';

/** The longest the registration waits for the app to settle, as Angular's `registerWhenStable:30000`. */
export const REGISTER_BY_MS = 30_000;

/**
 * The browser's service workers, or `null` where the app is not cached: a development build, whose files change as
 * they are written, or a browser without service workers.
 */
export const SERVICE_WORKERS = new InjectionToken<ServiceWorkerContainer | null>(
  'SERVICE_WORKERS',
  {
    factory: () =>
      isDevMode() || !('serviceWorker' in navigator) ? null : navigator.serviceWorker,
  },
);

/**
 * Caches the app on the device (L2-135 AC3, ADR 0032): registers the Angular service worker once the first screen has
 * settled, or 30 seconds after it starts if it never does, and tells a worker that takes control to set itself up, as
 * Angular's `provideServiceWorker` does. Bound on the screens' lazy parent route, so its code stays out of the initial
 * bundle; its listener and timer go with the app.
 */
export function provideAppCache(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const workers = inject(SERVICE_WORKERS);
    if (workers === null) return;
    const settled = inject(ApplicationRef).whenStable();
    const destroyRef = inject(DestroyRef);
    const initialize = () => workers.controller?.postMessage({ action: 'INITIALIZE' });
    workers.addEventListener('controllerchange', initialize);
    let late: ReturnType<typeof setTimeout> | undefined;
    let destroyed = false;
    destroyRef.onDestroy(() => {
      destroyed = true;
      clearTimeout(late);
      workers.removeEventListener('controllerchange', initialize);
    });
    void Promise.race([
      settled,
      new Promise<void>((resolve) => (late = setTimeout(resolve, REGISTER_BY_MS))),
    ]).then(() => {
      clearTimeout(late);
      if (destroyed) return;
      workers
        .register(APP_CACHE_WORKER)
        .catch((error: unknown) => console.error('The app could not be cached:', error));
    });
  });
}

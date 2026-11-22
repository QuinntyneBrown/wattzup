// Unit test
// Traces to: L2-135 AC3; ADR 0032
// Description: the app cache registers the Angular service worker once the first screen has settled, or 30 seconds
// after it starts if it never does, and only once; it tells a worker that takes control to set itself up; when the app
// goes it stops listening and registers nothing; with no service workers it does nothing.
import {
  ApplicationRef,
  EnvironmentInjector,
  type Provider,
  createEnvironmentInjector,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  APP_CACHE_WORKER,
  REGISTER_BY_MS,
  SERVICE_WORKERS,
  provideAppCache,
} from './provide-app-cache';

/** The browser's service workers: registrations are recorded, and a worker takes control on demand. */
class FakeServiceWorkers extends EventTarget {
  controller: { postMessage: ReturnType<typeof vi.fn> } | null = null;
  readonly register = vi.fn(() => Promise.resolve({} as ServiceWorkerRegistration));

  takeControl(): void {
    this.controller = { postMessage: vi.fn() };
    this.dispatchEvent(new Event('controllerchange'));
  }
}

/** Lets the registration's promises run. */
async function settle(): Promise<void> {
  for (let turn = 0; turn < 5; turn += 1) await Promise.resolve();
}

describe('provideAppCache', () => {
  let workers: FakeServiceWorkers;
  let settled: () => void;
  let injector: EnvironmentInjector;

  /** Starts the app cache, as the screens' parent route does, with the app not yet settled. */
  function start(serviceWorkers: FakeServiceWorkers | null = workers): void {
    const stable = new Promise<void>((resolve) => (settled = resolve));
    const providers: Provider[] = [
      { provide: SERVICE_WORKERS, useValue: serviceWorkers },
      { provide: ApplicationRef, useValue: { whenStable: () => stable } },
    ];
    injector = createEnvironmentInjector(
      [providers, provideAppCache()],
      TestBed.inject(EnvironmentInjector),
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
    workers = new FakeServiceWorkers();
  });

  afterEach(() => {
    if (!injector.destroyed) injector.destroy();
    vi.useRealTimers();
  });

  it('registers the Angular service worker once the first screen has settled, not before', async () => {
    start();
    await settle();
    expect(workers.register).not.toHaveBeenCalled();

    settled();
    await settle();

    expect(workers.register).toHaveBeenCalledExactlyOnceWith(APP_CACHE_WORKER);
  });

  it('registers it 30 seconds after the start when the app never settles', async () => {
    start();
    await vi.advanceTimersByTimeAsync(REGISTER_BY_MS - 1);
    expect(workers.register).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    expect(workers.register).toHaveBeenCalledExactlyOnceWith(APP_CACHE_WORKER);
  });

  it('registers it once when the app settles and the 30 seconds pass', async () => {
    start();
    settled();
    await vi.advanceTimersByTimeAsync(REGISTER_BY_MS);

    expect(workers.register).toHaveBeenCalledTimes(1);
  });

  it('tells a worker that takes control to set itself up, as Angular’s registration does', () => {
    start();

    workers.takeControl();

    expect(workers.controller?.postMessage).toHaveBeenCalledExactlyOnceWith({
      action: 'INITIALIZE',
    });
  });

  it('stops listening and registers nothing once the app goes', async () => {
    start();
    injector.destroy();

    workers.takeControl();
    settled();
    await vi.advanceTimersByTimeAsync(REGISTER_BY_MS);

    expect(workers.controller?.postMessage).not.toHaveBeenCalled();
    expect(workers.register).not.toHaveBeenCalled();
  });

  it('does nothing where the app is not cached: a development build or no service workers', async () => {
    start(null);
    settled();
    await vi.advanceTimersByTimeAsync(REGISTER_BY_MS);

    expect(workers.register).not.toHaveBeenCalled();
  });
});

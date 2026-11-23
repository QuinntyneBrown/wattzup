// Unit test
// Traces to: L2-150 AC2; ADR 0032
// Description: a new version is ready once the service worker says it has downloaded it, or when the loaded version
// can no longer run; nothing else makes it ready; Reload switches to the new version and then loads the app again, even
// when the switch fails; with no service worker, nothing is ever ready.
import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate, type VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { SwAppUpdates } from './sw-app-updates';

/** Angular's SwUpdate, whose events the spec sends. */
class FakeSwUpdate {
  isEnabled = true;
  readonly versionUpdates = new Subject<VersionEvent>();
  readonly unrecoverable = new Subject<{ type: 'UNRECOVERABLE_STATE'; reason: string }>();
  readonly activateUpdate = vi.fn(() => Promise.resolve(true));
}

const VERSION = { hash: 'b', appData: { version: 'next' } };

describe('SwAppUpdates', () => {
  let worker: FakeSwUpdate;
  const reload = vi.fn();

  function start(): SwAppUpdates {
    TestBed.configureTestingModule({
      providers: [
        SwAppUpdates,
        { provide: SwUpdate, useValue: worker },
        { provide: DOCUMENT, useValue: { location: { reload } } },
      ],
    });
    return TestBed.inject(SwAppUpdates);
  }

  beforeEach(() => {
    worker = new FakeSwUpdate();
    reload.mockReset();
  });

  it('is ready once the worker has downloaded the next version', () => {
    const updates = start();
    expect(updates.ready()).toBe(false);

    worker.versionUpdates.next({ type: 'VERSION_DETECTED', version: VERSION });
    worker.versionUpdates.next({ type: 'NO_NEW_VERSION_DETECTED', version: VERSION });
    worker.versionUpdates.next({
      type: 'VERSION_INSTALLATION_FAILED',
      version: VERSION,
      error: 'offline',
    });
    expect(updates.ready()).toBe(false);

    worker.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: VERSION,
    });
    expect(updates.ready()).toBe(true);
  });

  it('is ready when the loaded version can no longer run', () => {
    const updates = start();

    worker.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'files lost' });

    expect(updates.ready()).toBe(true);
  });

  it('switches to the new version, then loads the app again', async () => {
    const updates = start();
    worker.activateUpdate.mockImplementation(() => {
      expect(reload).not.toHaveBeenCalled();
      return Promise.resolve(true);
    });

    await updates.reload();

    expect(worker.activateUpdate).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('loads the app again even when the switch fails', async () => {
    const updates = start();
    worker.activateUpdate.mockRejectedValue(new Error('no version to switch to'));

    await updates.reload();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('is never ready without a service worker', async () => {
    worker.isEnabled = false;
    const updates = start();

    worker.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: VERSION,
    });
    await updates.reload();

    expect(updates.ready()).toBe(false);
    expect(worker.activateUpdate).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

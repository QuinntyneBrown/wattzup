// Unit test
// Traces to: L2-133 AC3, L2-164 AC5
// Description: the screen lock is asked for on hold, asked for again each time the tab becomes visible, let go on
// release or when its owner is destroyed, and the app carries on where the browser has no Screen Wake Lock API or
// refuses one. With Keep the screen awake off, it asks for nothing.
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RIDE_SETTINGS, type RideSettingsStore } from '@telo/api';
import { BrowserScreenWakeLock } from './browser-screen-wake-lock';

interface FakeSentinel {
  released: boolean;
  release(): Promise<void>;
}

describe('BrowserScreenWakeLock', () => {
  let sentinels: FakeSentinel[];
  let request: ReturnType<typeof vi.fn>;
  const keepAwake = signal(true);

  const install = (wakeLock: unknown) =>
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: wakeLock });
  const setVisibility = (state: DocumentVisibilityState) => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
    document.dispatchEvent(new Event('visibilitychange'));
  };
  const create = () => {
    TestBed.configureTestingModule({
      providers: [
        BrowserScreenWakeLock,
        {
          provide: RIDE_SETTINGS,
          useValue: {
            settings: () => ({ keepAwake: keepAwake() }),
          } as unknown as RideSettingsStore,
        },
      ],
    });
    return TestBed.inject(BrowserScreenWakeLock);
  };

  beforeEach(() => {
    keepAwake.set(true);
    sentinels = [];
    request = vi.fn(async () => {
      const sentinel: FakeSentinel = {
        released: false,
        release: async () => {
          sentinel.released = true;
        },
      };
      sentinels.push(sentinel);
      return sentinel;
    });
    install({ request });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'wakeLock');
  });

  it('asks for a screen lock on hold, once however often it is held', async () => {
    const lock = create();
    lock.hold();
    lock.hold();
    await Promise.resolve();
    expect(request.mock.calls).toEqual([['screen']]);
  });

  it('asks again each time the tab becomes visible, but not when it is hidden', async () => {
    create().hold();
    setVisibility('hidden');
    setVisibility('visible');
    await Promise.resolve();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('lets the lock go on release, and stops asking when the tab comes back', async () => {
    const lock = create();
    lock.hold();
    await vi.waitFor(() => expect(sentinels).toHaveLength(1));
    lock.release();
    setVisibility('visible');
    expect(sentinels[0].released).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('lets go of a lock that arrives after release', async () => {
    const lock = create();
    lock.hold();
    lock.release();
    await vi.waitFor(() => expect(sentinels).toHaveLength(1));
    await vi.waitFor(() => expect(sentinels[0].released).toBe(true));
  });

  it('lets the lock go when its owner is destroyed', async () => {
    create().hold();
    await vi.waitFor(() => expect(sentinels).toHaveLength(1));
    TestBed.resetTestingModule();
    expect(sentinels[0].released).toBe(true);
  });

  it('asks for nothing with Keep the screen awake off', async () => {
    keepAwake.set(false);
    create().hold();
    setVisibility('visible');
    await Promise.resolve();
    expect(request).not.toHaveBeenCalled();
  });

  it('does nothing where the browser has no Screen Wake Lock API', () => {
    Reflect.deleteProperty(navigator, 'wakeLock');
    expect(() => create().hold()).not.toThrow();
  });

  it('carries on when the browser refuses the lock', async () => {
    request.mockRejectedValue(new DOMException('Refused', 'NotAllowedError'));
    create().hold();
    await Promise.resolve();
    expect(request).toHaveBeenCalledTimes(1);
  });
});

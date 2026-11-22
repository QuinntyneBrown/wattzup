// Unit test
// Traces to: L2-162 AC2, AC3, AC6
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DEVICE_CHECK,
  type DeviceCheckOptions,
  type DeviceCheckOutcome,
  GRAPHICS_SUPPORT,
  type GraphicsApi,
  RIDE_SETTINGS,
  type RideSettings,
} from '@telo/api';
import { RECOMMENDED_SETTINGS } from '@telo/domain';
import { DeviceCheckStore } from './device-check-store';

/** A check that reports once and finishes when told to, or is stopped. */
function setup(api: GraphicsApi = 'webgl2', settings: Partial<RideSettings> = {}) {
  let finish: (outcome: DeviceCheckOutcome | null) => void = () => undefined;
  let asked: DeviceCheckOptions | undefined;
  const set = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      DeviceCheckStore,
      { provide: GRAPHICS_SUPPORT, useValue: { api: signal(api) } },
      {
        provide: RIDE_SETTINGS,
        useValue: { settings: signal({ ...RECOMMENDED_SETTINGS, ...settings }), set },
      },
      {
        provide: DEVICE_CHECK,
        useValue: () =>
          Promise.resolve({
            run: (options: DeviceCheckOptions) => {
              asked = options;
              options.progress({ level: 'high', secondsLeft: 12, percent: 20, tried: [] });
              options.signal.addEventListener('abort', () => finish(null));
              return new Promise<DeviceCheckOutcome | null>((done) => (finish = done));
            },
          }),
      },
    ],
  });
  const store = TestBed.inject(DeviceCheckStore);
  return {
    store,
    set,
    asked: () => asked,
    finish: (outcome: DeviceCheckOutcome) => finish(outcome),
  };
}

const found: DeviceCheckOutcome = {
  level: 'medium',
  displayFps: 60,
  tried: [{ level: 'high', fps: 33 }],
};

describe('DeviceCheckStore', () => {
  afterEach(() => vi.useRealTimers());

  it('runs the levels the graphics API allows and keeps what it found, with when', async () => {
    vi.useFakeTimers({ now: new Date('2026-11-22T19:31:00Z'), toFake: ['Date'] });
    const { store, set, asked, finish } = setup('webgpu');
    const run = store.start();
    await vi.waitFor(() => expect(store.progress()?.percent).toBe(20));
    expect(asked()?.levels).toEqual(['ultra', 'high', 'medium', 'low']);
    expect(asked()?.forceWebGL).toBe(false);
    vi.setSystemTime(new Date('2026-11-22T19:31:00Z'));
    finish(found);
    await run;
    expect(set).toHaveBeenCalledWith('deviceCheck', {
      ...found,
      checkedAt: '2026-11-22T19:31:00.000Z',
    });
    expect(store.running()).toBe(false);
  });

  it('starts at High with WebGL 2 chosen, and draws with it', async () => {
    const { store, asked } = setup('webgpu', { graphics: 'webgl2' });
    void store.start();
    await vi.waitFor(() => expect(asked()).toBeDefined());
    expect(asked()?.levels).toEqual(['high', 'medium', 'low']);
    expect(asked()?.forceWebGL).toBe(true);
    store.stop();
  });

  it('stopped, keeps nothing', async () => {
    const { store, set } = setup();
    const run = store.start();
    await vi.waitFor(() => expect(store.progress()?.percent).toBe(20));
    store.stop();
    await run;
    expect(store.running()).toBe(false);
    expect(set).not.toHaveBeenCalled();
  });

  it('with the tab hidden, stops and keeps nothing', async () => {
    const { store, set } = setup();
    const run = store.start();
    await vi.waitFor(() => expect(store.running()).toBe(true));
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    await run;
    delete (document as { hidden?: boolean }).hidden;
    expect(store.running()).toBe(false);
    expect(set).not.toHaveBeenCalled();
  });

  it('does nothing where the browser cannot draw 3D', async () => {
    const { store, asked } = setup('none');
    await store.start();
    expect(store.running()).toBe(false);
    expect(asked()).toBeUndefined();
  });
});

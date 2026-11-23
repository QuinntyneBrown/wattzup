// Unit test (the slice's acceptance table: Profile's Settings, which connects a strap, comes later)
// Traces to: L2-031 AC1 to AC4
// Description: choosing a strap opens the chooser filtered to the Heart Rate service, subscribes to Heart Rate
// Measurement and remembers the strap; a remembered strap reconnects without the chooser through getDevices(); a
// dropped strap reads disconnected, its bpm blanks, and it is retried every 3 seconds until it is back; 5 quiet
// seconds blank the bpm. A fake strap stands in for navigator.bluetooth; Vitest's fake clock moves time.
import { TestBed } from '@angular/core/testing';
import { REMEMBERED_STRAP_KEY, RememberedStrapStore } from '../storage/remembered-strap-store';
import { RETRY_MS } from './device-reconnector';
import { WebBluetoothHeartRateStrap } from './web-bluetooth-heart-rate-strap';

const SERVICE = 0x180d;
const MEASUREMENT = 0x2a37;

/** A Polar H10 behind a fake `navigator.bluetooth`: it records the chooser's filters and can drop and beat. */
function fakeStrap() {
  const requests: unknown[] = [];
  const subscribed: number[] = [];
  let on = true;
  let permitted = true;
  const measurement = Object.assign(new EventTarget(), {
    value: null as DataView | null,
    startNotifications: async () => {
      subscribed.push(MEASUREMENT);
      return measurement;
    },
  });
  const server = {
    connected: false,
    connect: async () => {
      if (!on) throw new DOMException('Bluetooth Device is no longer in range.', 'NetworkError');
      server.connected = true;
      return server;
    },
    disconnect: () => (server.connected = false),
    getPrimaryService: async (uuid: number) => {
      if (uuid !== SERVICE) throw new DOMException('No service', 'NotFoundError');
      return {
        getCharacteristic: async (c: number) =>
          c === MEASUREMENT ? measurement : Promise.reject(),
      };
    },
  };
  const device = Object.assign(new EventTarget(), {
    id: 'strap-1',
    name: 'Polar H10 9A1B2C3D',
    gatt: server,
  });
  return {
    requests,
    subscribed,
    bluetooth: {
      requestDevice: async (options: unknown) => (requests.push(options), device),
      getDevices: async () => (permitted ? [device] : []),
    },
    beat(bpm: number) {
      measurement.value = new DataView(Uint8Array.from([0x00, bpm]).buffer);
      measurement.dispatchEvent(new Event('characteristicvaluechanged'));
    },
    drop() {
      server.connected = false;
      device.dispatchEvent(new Event('gattserverdisconnected'));
    },
    switch(state: boolean) {
      on = state;
    },
    forbid() {
      permitted = false;
    },
  };
}

describe('WebBluetoothHeartRateStrap', () => {
  let strap: ReturnType<typeof fakeStrap>;
  let service: WebBluetoothHeartRateStrap;

  const create = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [WebBluetoothHeartRateStrap, RememberedStrapStore],
    });
    return TestBed.inject(WebBluetoothHeartRateStrap);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    strap = fakeStrap();
    Object.defineProperty(navigator, 'bluetooth', { value: strap.bluetooth, configurable: true });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    service = create();
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    Reflect.deleteProperty(navigator, 'bluetooth');
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('opens the chooser filtered to the Heart Rate service (AC1)', async () => {
    await service.choose();

    expect(strap.requests).toEqual([{ filters: [{ services: [SERVICE] }] }]);
  });

  it('subscribes to Heart Rate Measurement once chosen, and shows each bpm (AC2)', async () => {
    await expect(service.choose()).resolves.toBe(true);

    expect(strap.subscribed).toEqual([MEASUREMENT]);
    expect(service.state()).toBe('connected');
    expect(service.name()).toBe('Polar H10 9A1B2C3D');
    strap.beat(142);
    expect(service.bpm()).toBe(142);
  });

  it('blanks the bpm after 5 seconds without a measurement', async () => {
    await service.choose();
    strap.beat(142);

    await vi.advanceTimersByTimeAsync(4999);
    expect(service.bpm()).toBe(142);
    await vi.advanceTimersByTimeAsync(1);
    expect(service.bpm()).toBeNull();
  });

  it('resolves false, and stays without a strap, when the rider closes the chooser', async () => {
    strap.bluetooth.requestDevice = async () => {
      throw new DOMException('User cancelled the requestDevice() chooser.', 'NotFoundError');
    };

    await expect(service.choose()).resolves.toBe(false);
    expect(service.state()).toBe('none');
  });

  it('reconnects to the strap chosen before, without the chooser, where getDevices() exists (AC3)', async () => {
    await service.choose();
    expect(localStorage.getItem(REMEMBERED_STRAP_KEY)).not.toBeNull();
    const reopened = create();
    strap.requests.length = 0;

    await expect(reopened.reconnectRemembered()).resolves.toBe(true);

    expect(strap.requests).toEqual([]);
    expect(reopened.state()).toBe('connected');
  });

  it('does not reconnect when no strap was chosen, or the browser no longer permits it (AC3)', async () => {
    await expect(service.reconnectRemembered()).resolves.toBe(false);

    await service.choose();
    strap.forbid();
    await expect(create().reconnectRemembered()).resolves.toBe(false);
  });

  it('reads disconnected and blanks the bpm on a drop, then retries every 3 seconds until it is back (AC4)', async () => {
    await service.choose();
    strap.beat(142);
    strap.switch(false);

    strap.drop();
    expect(service.state()).toBe('disconnected');
    expect(service.bpm()).toBeNull();

    await vi.advanceTimersByTimeAsync(RETRY_MS * 2);
    expect(service.state()).toBe('disconnected');
    expect(console.error).toHaveBeenCalledWith(
      '[heart rate] NetworkError: Bluetooth Device is no longer in range.',
    );

    strap.switch(true);
    await vi.advanceTimersByTimeAsync(RETRY_MS);
    expect(service.state()).toBe('connected');
    expect(strap.subscribed).toEqual([MEASUREMENT, MEASUREMENT]);
  });

  it('stops retrying once the rider disconnects it', async () => {
    await service.choose();
    strap.switch(false);
    strap.drop();

    service.disconnect();
    strap.switch(true);
    await vi.advanceTimersByTimeAsync(RETRY_MS * 3);

    expect(service.state()).toBe('none');
    expect(strap.subscribed).toEqual([MEASUREMENT]);
  });
});

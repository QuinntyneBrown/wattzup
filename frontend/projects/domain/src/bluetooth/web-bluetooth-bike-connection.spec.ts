// Unit test
// Traces to: L2-016 AC3; L2-017 AC1, AC3 to AC5; L2-027 AC4
// Description: after a drop the connection tries the same device again on its own, sends the last target resistance
// before anything else once it is back, lets Reconnect try at once, and writes every Web Bluetooth error to the
// console as name: message. A fake device stands in for navigator.bluetooth; Vitest's fake clock moves time.
import { TestBed } from '@angular/core/testing';
import { TICKER } from '@telo/api';
import { Subject } from 'rxjs';
import { EchelonProtocol, toHex } from '../protocol/echelon-protocol';
import { RETRY_MS } from './device-reconnector';
import { WebBluetoothBikeConnection } from './web-bluetooth-bike-connection';

const FRAME = [0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f];
const INIT = ['F0 A1 00 91', 'F0 A3 00 93', 'F0 B0 01 01 A2'];

/** An Echelon behind a fake `navigator.bluetooth`: it records writes and can drop, switch off and notify. */
function fakeEchelon() {
  const writes: string[] = [];
  let on = true;
  const notify = Object.assign(new EventTarget(), {
    value: null as DataView | null,
    startNotifications: async () => notify,
  });
  const write = {
    writeValueWithResponse: async (bytes: Uint8Array) => void writes.push(toHex(bytes)),
  };
  const server = {
    connected: false,
    connect: async () => {
      if (!on) throw new DOMException('Bluetooth Device is no longer in range.', 'NetworkError');
      server.connected = true;
      return server;
    },
    disconnect: () => (server.connected = false),
    getPrimaryServices: async () => [
      {
        uuid: EchelonProtocol.service,
        getCharacteristic: async (uuid: string) =>
          uuid === EchelonProtocol.notify ? notify : write,
      },
    ],
  };
  const device = Object.assign(new EventTarget(), {
    id: 'bike-1',
    name: 'ECH-EX5S-141844',
    gatt: server,
  });
  return {
    writes,
    bluetooth: { requestDevice: async () => device },
    frame() {
      notify.value = new DataView(Uint8Array.from(FRAME).buffer);
      notify.dispatchEvent(new Event('characteristicvaluechanged'));
    },
    drop() {
      server.connected = false;
      device.dispatchEvent(new Event('gattserverdisconnected'));
    },
    switch(state: boolean) {
      on = state;
    },
  };
}

describe('WebBluetoothBikeConnection', () => {
  let bike: ReturnType<typeof fakeEchelon>;
  let connection: WebBluetoothBikeConnection;
  let errors: unknown[];

  /** Lets the initialisation's 300 ms gaps pass, then sends the bike's first frame. */
  const initialiseAndStream = async () => {
    await vi.advanceTimersByTimeAsync(700);
    bike.frame();
    await vi.advanceTimersByTimeAsync(0);
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    bike = fakeEchelon();
    Object.defineProperty(navigator, 'bluetooth', { value: bike.bluetooth, configurable: true });
    errors = [];
    vi.spyOn(console, 'error').mockImplementation((text: unknown) => void errors.push(text));
    TestBed.configureTestingModule({
      providers: [
        WebBluetoothBikeConnection,
        { provide: TICKER, useValue: { seconds: new Subject<number>() } },
      ],
    });
    connection = TestBed.inject(WebBluetoothBikeConnection);
    await connection.requestBike();
    const connected = connection.connect();
    await initialiseAndStream();
    await connected;
  });

  afterEach(() => {
    connection.ngOnDestroy();
    Reflect.deleteProperty(navigator, 'bluetooth');
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('reads disconnected on a drop, and connected again once a retry reaches the bike (AC1)', async () => {
    bike.drop();
    expect(connection.ble()).toBe('disconnected');

    await vi.advanceTimersByTimeAsync(RETRY_MS);
    await initialiseAndStream();

    expect(connection.ble()).toBe('connected');
  });

  it('sends the last target resistance again before anything else after a reconnect (AC4)', async () => {
    await connection.setResistance(12);
    bike.drop();
    bike.writes.length = 0;

    await vi.advanceTimersByTimeAsync(RETRY_MS);
    await initialiseAndStream();

    expect(bike.writes).toEqual([...INIT, toHex(EchelonProtocol.setResistance(12))]);
  });

  it('sends a level asked for while the bike was away first once it is back (L2-027 AC4)', async () => {
    await connection.setResistance(12);
    bike.drop();
    await expect(connection.setResistance(18)).rejects.toMatchObject({ code: 'failed' });
    bike.writes.length = 0;

    await vi.advanceTimersByTimeAsync(RETRY_MS);
    await initialiseAndStream();

    expect(bike.writes).toEqual([...INIT, toHex(EchelonProtocol.setResistance(18))]);
  });

  it('tries at once on Reconnect instead of waiting for the next retry (AC3)', async () => {
    bike.drop();
    bike.writes.length = 0;

    connection.reconnectNow();
    await initialiseAndStream();

    expect(bike.writes).toEqual(INIT);
    expect(connection.ble()).toBe('connected');
  });

  it('writes a Web Bluetooth error to the console as name: message with its area, and keeps it as text (AC5, L2-115 AC3)', async () => {
    bike.switch(false);
    bike.drop();

    await vi.advanceTimersByTimeAsync(RETRY_MS);

    expect(errors).toEqual(['[bluetooth] NetworkError: Bluetooth Device is no longer in range.']);
    expect(connection.lastError()).toBe('NetworkError: Bluetooth Device is no longer in range.');
    expect(connection.ble()).toBe('disconnected');
  });

  it('stops trying once the rider ends the ride (disconnect)', async () => {
    bike.switch(false);
    bike.drop();
    connection.disconnect();

    await vi.advanceTimersByTimeAsync(RETRY_MS * 3);

    expect(errors).toEqual([]);
    expect(connection.ble()).toBe('idle');
  });
});

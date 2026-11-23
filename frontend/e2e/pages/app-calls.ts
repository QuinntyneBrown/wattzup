import type { Page } from '@playwright/test';

/**
 * Makes, in the page, the browser calls the app will make once its Bluetooth, API and hub clients exist
 * (slices 2.3, 9.1 and 14.1). It lets the harness spec prove the fakes from the outside before the app uses them.
 */
export class AppCalls {
  constructor(private readonly page: Page) {}

  /** Chooses the bike offering `service`, connects, and subscribes to `notify`; `write` is kept for `write()`. */
  async pairBike(service: string, write: string, notify: string): Promise<void> {
    await this.page.evaluate(
      async ({ service, write, notify }) => {
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ services: [service] }],
        });
        const server = await device.gatt!.connect();
        const gatt = await server.getPrimaryService(service);
        const updates = await gatt.getCharacteristic(notify);
        const page = window as unknown as {
          heard: string[];
          writer: BluetoothRemoteGATTCharacteristic;
        };
        page.heard = [];
        updates.addEventListener('characteristicvaluechanged', () => {
          const bytes = new Uint8Array(updates.value!.buffer);
          page.heard.push(
            Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' '),
          );
        });
        await updates.startNotifications();
        page.writer = await gatt.getCharacteristic(write);
      },
      { service, write, notify },
    );
  }

  /** Writes `hex` ("F0 A1 00 91") with response to the characteristic `pairBike` kept. */
  async write(hex: string): Promise<void> {
    await this.page.evaluate(async (hex) => {
      const bytes = Uint8Array.from(hex.split(' '), (b) => parseInt(b, 16));
      await (
        window as unknown as { writer: BluetoothRemoteGATTCharacteristic }
      ).writer.writeValueWithResponse(bytes);
    }, hex);
  }

  /** Every notification the page has heard since pairing, as hex. */
  heard(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { heard: string[] }).heard);
  }

  /** Asks for a bike without catching the refusal, as a careless app would. */
  async requestAnyBike(): Promise<void> {
    await this.page.evaluate(() =>
      navigator.bluetooth.requestDevice({ acceptAllDevices: true }).catch(() => undefined),
    );
  }

  /** Sends `method path` with credentials, as the app's HTTP client will, and returns the status and JSON body. */
  request(method: string, path: string): Promise<{ status: number; body: unknown }> {
    return this.page.evaluate(
      async ({ method, path }) => {
        const response = await fetch(path, { method, credentials: 'include' });
        return {
          status: response.status,
          body: response.status === 204 ? null : await response.json(),
        };
      },
      { method, path },
    );
  }

  /**
   * Connects to the ride hub as the SignalR client will: negotiate, open the WebSocket, and exchange the JSON
   * handshake. Every invocation the hub sends is kept for `hubHeard()`. Resolves once the handshake is answered.
   */
  async joinHub(): Promise<void> {
    await this.page.evaluate(async () => {
      const page = window as unknown as { hub: WebSocket; hubHeard: unknown[] };
      const negotiated = await fetch('/hubs/ride/negotiate?negotiateVersion=1', { method: 'POST' });
      const { connectionToken } = (await negotiated.json()) as { connectionToken: string };
      page.hubHeard = [];
      page.hub = new WebSocket(`ws://${location.host}/hubs/ride?id=${connectionToken}`);
      await new Promise<void>((resolve, reject) => {
        page.hub.onerror = () => reject(new Error('the ride hub refused the WebSocket'));
        page.hub.onopen = () => page.hub.send('{"protocol":"json","version":1}\x1e');
        page.hub.onmessage = (event: MessageEvent<string>) => {
          for (const frame of event.data.split('\x1e').filter(Boolean)) {
            const message = JSON.parse(frame) as {
              type?: number;
              target?: string;
              arguments?: unknown[];
            };
            if (message.type === undefined) resolve();
            else if (message.type === 1)
              page.hubHeard.push({ target: message.target, arguments: message.arguments });
          }
        };
      });
    });
  }

  /** Invokes `target` on the hub without waiting for a result, as `connection.send` does. */
  async sendToHub(target: string, ...args: unknown[]): Promise<void> {
    await this.page.evaluate(
      ({ target, args }) =>
        (window as unknown as { hub: WebSocket }).hub.send(
          `${JSON.stringify({ type: 1, target, arguments: args })}\x1e`,
        ),
      { target, args },
    );
  }

  /** The invocations the hub has sent the page, oldest first. */
  hubHeard(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as { hubHeard: unknown[] }).hubHeard);
  }

  /** Starts negotiating with the ride hub and ignores the outcome, as a careless app would. */
  async tryHub(): Promise<void> {
    await this.page.evaluate(() =>
      fetch('/hubs/ride/negotiate?negotiateVersion=1', { method: 'POST' }).catch(() => undefined),
    );
  }
}

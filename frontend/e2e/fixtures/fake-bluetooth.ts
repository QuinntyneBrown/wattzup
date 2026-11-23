import type { Page } from '@playwright/test';

/** A bike the fake Bluetooth stack offers: its advertised name, and its services' characteristic UUIDs. */
export interface FakeBike {
  name: string;
  services: Record<string, string[]>;
  /** The name and identifier Connect Bike shows for it, which Telo Ride keeps when it remembers the bike. */
  card?: { name: string; identifier: string | null };
  /** What `readValue` returns for a readable characteristic; reading any other is unexpected. */
  values?: Record<string, number[]>;
}

/** One write the page made, in the order it made them. */
export interface RecordedWrite {
  characteristic: string;
  /** Upper-case hex bytes separated by spaces, as the protocol documents them ("F0 A1 00 91"). */
  hex: string;
  withResponse: boolean;
}

/** The options the page passed to `requestDevice`, as JSON (numbers stay numbers, UUIDs strings). */
export interface RecordedRequest {
  filters: { services: (string | number)[] }[];
  optionalServices?: (string | number)[];
}

/** The id the fake gives every device, as a browser gives each permitted device its own. */
const FAKE_DEVICE_ID = 'fake-bike';

type Report =
  | { kind: 'write'; characteristic: string; hex: string; withResponse: boolean }
  | { kind: 'subscribe'; characteristic: string }
  | { kind: 'read'; characteristic: string }
  | { kind: 'request'; options: RecordedRequest }
  | { kind: 'unexpected'; call: string };

/**
 * A fake `navigator.bluetooth`, installed before the app loads (L2-148 AC1). Until the spec offers a bike, every call
 * is unexpected; so is a call to a member, service or characteristic the bike does not have. An unexpected call
 * rejects in the page and fails the spec. Writes and unexpected calls reach the spec through a binding, so they
 * survive navigation, and a write resolves in the page only once the spec has recorded it.
 */
export class FakeBluetooth {
  private readonly recorded: RecordedWrite[] = [];
  private readonly refused: string[] = [];
  private readonly requested: RecordedRequest[] = [];
  private readonly order: string[] = [];

  private constructor(private readonly page: Page) {}

  static async install(page: Page): Promise<FakeBluetooth> {
    const fake = new FakeBluetooth(page);
    await page.exposeFunction('__fakeBluetoothReport', (report: Report) => fake.receive(report));
    await page.addInitScript(installInPage);
    return fake;
  }

  /** From the next page load, the browser has no `navigator.bluetooth`, as Safari and Firefox (L2-008). */
  async remove(): Promise<void> {
    await this.page.addInitScript(removeFromPage);
  }

  /**
   * From the next page load, the page is served over plain `http` from an address other than `localhost`: no secure
   * context, so no `navigator.bluetooth` either, as Chromium does (L2-009).
   */
  async servePlainHttp(): Promise<void> {
    await this.page.addInitScript(() =>
      Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true }),
    );
    await this.page.addInitScript(removeFromPage);
  }

  /** Puts the fake `navigator.bluetooth` back on the current page, as if the rider had switched browser. */
  async restore(): Promise<void> {
    await this.page.evaluate(installInPage);
  }

  /** Offers `bike` to `requestDevice` and `getDevices`, from the next page load and on the current page. */
  async offer(bike: FakeBike): Promise<void> {
    await this.page.addInitScript(
      (offered) => Object.assign(window, { __fakeBike: offered }),
      bike,
    );
    await this.page.evaluate((offered) => Object.assign(window, { __fakeBike: offered }), bike);
  }

  /**
   * A bike this browser paired earlier: Telo Ride's record of it (`telo-ride.bike` in localStorage) and the
   * permission `getDevices()` returns it by, so the app can reconnect without the chooser (L2-015). With
   * `lastSeenDaysAgo`, the record says the app last connected it that many days ago (L2-113 AC4).
   */
  async remember(
    bike: FakeBike,
    { lastSeenDaysAgo }: { lastSeenDaysAgo?: number } = {},
  ): Promise<void> {
    await this.offer(bike);
    const { name, identifier } = bike.card ?? { name: bike.name, identifier: null };
    const seenAt =
      lastSeenDaysAgo === undefined
        ? undefined
        : new Date(Date.now() - lastSeenDaysAgo * 86_400_000).toISOString();
    const record = JSON.stringify({
      id: FAKE_DEVICE_ID,
      name,
      identifier,
      kind: 'echelon',
      seenAt,
    });
    await this.page.addInitScript((value) => localStorage.setItem('telo-ride.bike', value), record);
  }

  /** The rider closes the browser's chooser without picking a bike: `requestDevice` rejects with `NotFoundError`. */
  async cancelChooser(): Promise<void> {
    await this.chooser('cancel');
  }

  /** A policy keeps the chooser from opening: `requestDevice` rejects with `SecurityError` (L2-012 AC4). */
  async blockChooser(): Promise<void> {
    await this.chooser('block');
  }

  /** The computer's Bluetooth radio is off: `getAvailability()` resolves `false` (L2-018). */
  async adapterOff(): Promise<void> {
    await this.adapter(false);
  }

  /** The radio is on again; `availabilitychanged` is not sent, so the page learns it only when it asks again. */
  async adapterOn(): Promise<void> {
    await this.adapter(true);
  }

  private async adapter(on: boolean): Promise<void> {
    await this.page.addInitScript((value) => Object.assign(window, { __fakeAdapterOn: value }), on);
    await this.page.evaluate((value) => Object.assign(window, { __fakeAdapterOn: value }), on);
  }

  /** The bike drops its link: GATT reports disconnected and `gattserverdisconnected` fires (L2-017). */
  async drop(): Promise<void> {
    await this.page.evaluate(() =>
      (window as unknown as { __fakeBluetooth: { drop(): void } }).__fakeBluetooth.drop(),
    );
  }

  /** The bike is switched off: every GATT connection attempt fails, as a bike out of range does. */
  async switchOff(): Promise<void> {
    await this.power(false);
  }

  /** The bike is switched on and pedalled: GATT connects again. */
  async switchOn(): Promise<void> {
    await this.power(true);
  }

  private async power(on: boolean): Promise<void> {
    await this.page.addInitScript((value) => Object.assign(window, { __fakeBikeOn: value }), on);
    await this.page.evaluate((value) => Object.assign(window, { __fakeBikeOn: value }), on);
  }

  /** The chooser opens again as usual. */
  async allowChooser(): Promise<void> {
    await this.chooser(null);
  }

  /** Every `requestDevice` call's options, oldest first. */
  requests(): RecordedRequest[] {
    return [...this.requested];
  }

  /** Subscriptions, reads and writes in the order the page made them: `subscribe <uuid>`, `read <uuid>` or `write <uuid> <hex>`. */
  log(): string[] {
    return [...this.order];
  }

  private async chooser(mode: 'cancel' | 'block' | null): Promise<void> {
    await this.page.addInitScript((m) => Object.assign(window, { __fakeChooser: m }), mode);
    await this.page.evaluate((m) => Object.assign(window, { __fakeChooser: m }), mode);
  }

  /** Pushes `bytes` from the bike on `characteristic`, to every subscription the page holds. */
  async notify(characteristic: string, bytes: readonly number[]): Promise<void> {
    await this.page.evaluate(
      ({ characteristic, bytes }) =>
        (
          window as unknown as { __fakeBluetooth: { notify(c: string, b: number[]): void } }
        ).__fakeBluetooth.notify(characteristic, bytes),
      { characteristic, bytes: [...bytes] },
    );
  }

  /** Every write the page made, oldest first. */
  writes(): RecordedWrite[] {
    return [...this.recorded];
  }

  /** The calls the spec did not expect; the shared fixture fails the spec when there are any. */
  unexpected(): string[] {
    return [...this.refused];
  }

  private receive(report: Report): void {
    if (report.kind === 'request') {
      this.requested.push(report.options);
    } else if (report.kind === 'read') {
      this.order.push(`read ${report.characteristic}`);
    } else if (report.kind === 'subscribe') {
      this.order.push(`subscribe ${report.characteristic}`);
    } else if (report.kind === 'write') {
      this.order.push(`write ${report.characteristic} ${report.hex}`);
      this.recorded.push({
        characteristic: report.characteristic,
        hex: report.hex,
        withResponse: report.withResponse,
      });
    } else {
      this.refused.push(report.call);
    }
  }
}

/** Takes `navigator.bluetooth` away, the browser's own and the fake. It must not close over anything outside itself. */
function removeFromPage(): void {
  delete (navigator as unknown as { bluetooth?: unknown }).bluetooth;
  delete (Navigator.prototype as unknown as { bluetooth?: unknown }).bluetooth;
}

/** Runs in the page before any app script. It must not close over anything outside itself. */
function installInPage(): void {
  type Bike = {
    name: string;
    services: Record<string, string[]>;
    values?: Record<string, number[]>;
  };
  const report = (window as unknown as { __fakeBluetoothReport(r: unknown): Promise<void> })
    .__fakeBluetoothReport;
  const offered = (): Bike | undefined => (window as unknown as { __fakeBike?: Bike }).__fakeBike;
  const refuse = async (call: string): Promise<never> => {
    await report({ kind: 'unexpected', call });
    throw new DOMException(`Unexpected Bluetooth call: ${call}`, 'NotFoundError');
  };
  /** Reports any member the fake does not implement; `then` and symbols are probes, not calls. */
  const strict = <T extends object>(target: T, name: string): T =>
    new Proxy(target, {
      get(object, key) {
        if (typeof key === 'symbol' || key === 'then' || key in object) {
          const value = Reflect.get(object, key, object) as unknown;
          return typeof value === 'function' ? value.bind(object) : value;
        }
        void report({ kind: 'unexpected', call: `${name}.${key}` });
        return undefined;
      },
    });
  const hex = (value: BufferSource): string =>
    Array.from(
      ArrayBuffer.isView(value)
        ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
        : new Uint8Array(value),
      (b) => b.toString(16).toUpperCase().padStart(2, '0'),
    ).join(' ');

  const subscriptions = new Map<string, EventTarget[]>();
  const devices: { device: EventTarget; server: { connected: boolean } }[] = [];
  const characteristic = (bike: Bike, uuid: string) => {
    const write = async (value: BufferSource, withResponse: boolean) =>
      report({ kind: 'write', characteristic: uuid, hex: hex(value), withResponse });
    const c = Object.assign(new EventTarget(), {
      uuid,
      value: null as DataView | null,
      startNotifications: async () => {
        await report({ kind: 'subscribe', characteristic: uuid });
        subscriptions.set(uuid, [...(subscriptions.get(uuid) ?? []), c]);
        return c;
      },
      stopNotifications: async () => {
        subscriptions.set(
          uuid,
          (subscriptions.get(uuid) ?? []).filter((s) => s !== c),
        );
        return c;
      },
      readValue: async () => {
        const bytes = bike.values?.[uuid];
        if (!bytes) return refuse(`readValue(${uuid})`);
        await report({ kind: 'read', characteristic: uuid });
        return new DataView(Uint8Array.from(bytes).buffer);
      },
      writeValueWithResponse: (value: BufferSource) => write(value, true),
      writeValueWithoutResponse: (value: BufferSource) => write(value, false),
    });
    return strict(c, 'characteristic');
  };
  const device = (bike: Bike) => {
    const service = (uuid: string) =>
      strict(
        {
          uuid,
          // A characteristic the bike lacks rejects as a real one does, so a link can probe for it.
          getCharacteristic: async (c: string) => {
            if (bike.services[uuid].includes(c)) return characteristic(bike, c);
            throw new DOMException(`No characteristic ${c}`, 'NotFoundError');
          },
        },
        'service',
      );
    const server = {
      connected: false,
      device: null as unknown,
      connect: async () => {
        if ((window as unknown as { __fakeBikeOn?: boolean }).__fakeBikeOn === false)
          throw new DOMException('Bluetooth Device is no longer in range.', 'NetworkError');
        server.connected = true;
        return gatt;
      },
      disconnect: () => {
        server.connected = false;
      },
      getPrimaryService: async (uuid: string) => {
        if (!bike.services[uuid]) return refuse(`getPrimaryService(${uuid})`);
        return service(uuid);
      },
      getPrimaryServices: async () => Object.keys(bike.services).map(service),
    };
    const gatt = strict(server, 'gatt');
    const d = strict(
      Object.assign(new EventTarget(), { id: 'fake-bike', name: bike.name, gatt }),
      'device',
    );
    server.device = d;
    devices.push({ device: d, server });
    return d;
  };

  const bluetooth = strict(
    Object.assign(new EventTarget(), {
      requestDevice: async (options: unknown) => {
        await report({ kind: 'request', options: JSON.parse(JSON.stringify(options)) });
        const mode = (window as unknown as { __fakeChooser?: string | null }).__fakeChooser;
        if (mode === 'cancel')
          throw new DOMException('User cancelled the requestDevice() chooser.', 'NotFoundError');
        if (mode === 'block')
          throw new DOMException(
            'requestDevice() is disallowed by permissions policy.',
            'SecurityError',
          );
        const bike = offered();
        return bike ? device(bike) : refuse('requestDevice');
      },
      // The radio is on unless the spec switched it off; asking is not a bike call, so it needs no offer.
      getAvailability: async () =>
        (window as unknown as { __fakeAdapterOn?: boolean }).__fakeAdapterOn !== false,
      getDevices: async () => {
        const bike = offered();
        return bike ? [device(bike)] : refuse('getDevices');
      },
    }),
    'bluetooth',
  );
  Object.defineProperty(navigator, 'bluetooth', { value: bluetooth, configurable: true });
  Object.assign(window, {
    __fakeBluetooth: {
      drop: () => {
        subscriptions.clear();
        for (const { device, server } of devices.filter(({ server }) => server.connected)) {
          server.connected = false;
          device.dispatchEvent(new Event('gattserverdisconnected'));
        }
      },
      notify: (uuid: string, bytes: number[]) => {
        for (const c of subscriptions.get(uuid) ?? []) {
          (c as unknown as { value: DataView }).value = new DataView(Uint8Array.from(bytes).buffer);
          c.dispatchEvent(new Event('characteristicvaluechanged'));
        }
      },
    },
  });
}

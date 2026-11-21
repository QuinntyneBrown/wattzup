// Unit Test
// Traces to: L2-090, L2-091
// Description: BikeLink picks the bike through the chooser, connects, subscribes, sends the init
// sequence 300 ms apart, keeps the link alive and recovers it, on a fake port and a fake clock.
import { PacketLog } from './packet-log';
import { BROWSER_LOG } from '../engine/browser-log';
import { TestBed } from '@angular/core/testing';
import { BikeStateStore } from '../engine/bike-state-store';
import { TelemetryIngestor } from '../engine/telemetry-ingestor';
import { BikeLink } from './bike-link';
import {
  type BikeDevice,
  BLUETOOTH_PORT,
  type BluetoothPort,
  ChooserBlockedError,
  type GattLink,
} from './bluetooth-port';
import { CLOCK } from './clock';
import { FakeClock } from './fake-clock';

class FakeGatt implements GattLink {
  readonly log: string[];
  private inFlight = false;
  /** As Chrome: a write while another is in flight fails (one GATT operation at a time). */
  constructor(
    log: string[],
    private readonly strict = false,
  ) {
    this.log = log;
  }
  onPacket: ((frame: Uint8Array) => void) | null = null;
  async startNotifications(onPacket: (frame: Uint8Array) => void): Promise<void> {
    this.onPacket = onPacket;
    this.log.push('subscribe');
  }
  async write(bytes: Uint8Array): Promise<void> {
    if (this.strict) {
      if (this.inFlight) {
        throw new DOMException('GATT operation already in progress.', 'NetworkError');
      }
      this.inFlight = true;
      await null;
      await null;
      this.inFlight = false;
    }
    this.log.push(`write ${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`);
  }
  disconnect(): void {
    this.log.push('disconnect');
  }
}

class FakePort implements BluetoothPort {
  readonly log: string[] = [];
  answer: 'pick' | 'cancel' | 'blocked' = 'pick';
  /** Writes fail while another is in flight, as on Chrome. */
  strict = false;
  /** Errors the next connection attempts throw, in order. */
  readonly connectFailures: Error[] = [];
  /** How many next connection attempts the bike never answers, as an asleep bike. */
  connectHangs = 0;
  private readonly dropped: (() => void)[] = [];
  /** The link of the latest connection. */
  gatt: FakeGatt | null = null;

  /** The bike sends a frame, as space-separated hex bytes. */
  notify(hex: string): void {
    this.gatt?.onPacket?.(Uint8Array.from(hex.split(' ').map((b) => parseInt(b, 16))));
  }

  support(): 'ready' {
    return 'ready';
  }

  async availability(): Promise<boolean> {
    return true;
  }

  onAvailabilityChanged(): void {
    // Not exercised by BikeLink.
  }

  /** What `getDevices()` finds: bikes chosen on earlier visits (L2-090 AC5). */
  known: BikeDevice[] = [];
  /** Resolves the remembered bike's `whenNearby()`, as its first advertisement. */
  advertise: () => void = () => undefined;

  async knownBikes(): Promise<BikeDevice[]> {
    this.log.push('known');
    return this.known;
  }

  /** A bike chosen before; `nearby` false leaves out `whenNearby`, as a browser without
   * watchAdvertisements(). */
  remember(nearby = true): void {
    const bike = this.bike();
    const seen = new Promise<void>((resolve) => (this.advertise = resolve));
    this.known = [nearby ? { ...bike, whenNearby: () => seen } : bike];
  }

  async requestBike(): Promise<BikeDevice | null> {
    this.log.push('chooser');
    if (this.answer === 'cancel') return null;
    if (this.answer === 'blocked') throw new ChooserBlockedError();
    return this.bike();
  }

  private bike(): BikeDevice {
    return {
      name: 'ECHEX-3-141844',
      connect: async () => {
        this.log.push('connect');
        if (this.connectHangs > 0) {
          this.connectHangs--;
          return new Promise<GattLink>(() => undefined);
        }
        const failure = this.connectFailures.shift();
        if (failure) throw failure;
        this.gatt = new FakeGatt(this.log, this.strict);
        return this.gatt;
      },
      onDisconnected: (listener) => this.dropped.push(listener),
    };
  }

  /** The bike drops the link (`gattserverdisconnected`). */
  drop(): void {
    for (const listener of this.dropped) listener();
  }

  count(entry: string): number {
    return this.log.filter((e) => e === entry).length;
  }
}

const KEEPALIVE = 'write f0a0010192';

/** Pairs and lets the init sequence finish. */
async function connected() {
  const ctx = setUp();
  void ctx.link.pair();
  await ctx.clock.advance(600);
  expect(ctx.store.state().ble).toBe('connected');
  return ctx;
}

function setUp() {
  const warnings: string[] = [];
  const port = new FakePort();
  const clock = new FakeClock();
  TestBed.configureTestingModule({
    providers: [
      BikeLink,
      PacketLog,
      BikeStateStore,
      TelemetryIngestor,
      { provide: BLUETOOTH_PORT, useValue: port },
      { provide: CLOCK, useValue: clock },
      {
        provide: BROWSER_LOG,
        useValue: {
          info: () => undefined,
          warn: (m: string) => warnings.push(m),
          debug: () => undefined,
        },
      },
    ],
  });
  return {
    port,
    clock,
    warnings,
    store: TestBed.inject(BikeStateStore),
    link: TestBed.inject(BikeLink),
  };
}

describe('BikeLink', () => {
  it('needs pairing until a bike is picked', () => {
    expect(setUp().link.pairingRequired()).toBe(true);
  });

  describe('a bike chosen on an earlier visit (L2-090 AC5)', () => {
    it('is connected without the chooser once it advertises', async () => {
      const { port, link, store, clock } = setUp();
      port.remember();
      const done = link.reconnectKnown();
      await Promise.resolve();
      expect(port.count('connect')).toBe(0);
      port.advertise();
      await clock.advance(1000);
      await done;
      expect(port.count('chooser')).toBe(0);
      expect(port.count('connect')).toBe(1);
      expect(store.state()).toMatchObject({ ble: 'connected', device: 'ECHEX-3-141844' });
      expect(link.pairingRequired()).toBe(false);
    });

    it('is left alone where the browser cannot watch for its advertisements', async () => {
      const { port, link } = setUp();
      port.remember(false);
      await link.reconnectKnown();
      expect(port.count('connect')).toBe(0);
      expect(link.pairingRequired()).toBe(true);
    });

    it('is not connected when the rider picked a bike while it was quiet', async () => {
      const { port, link, clock } = setUp();
      port.remember();
      const done = link.reconnectKnown();
      const paired = link.pair();
      await clock.advance(1000);
      await paired;
      port.advertise();
      await done;
      expect(port.count('connect')).toBe(1);
    });

    it('with no bike remembered, nothing is asked of the bike', async () => {
      const { port, link } = setUp();
      await link.reconnectKnown();
      expect(port.log).toEqual(['known']);
    });
  });

  it('connects, subscribes, then writes the 3 init commands 300 ms apart (L2-090 AC3)', async () => {
    const { port, store, clock, link } = setUp();
    const pairing = link.pair();
    await clock.advance(0);
    expect(store.state()).toMatchObject({ ble: 'connected', device: 'ECHEX-3-141844' });
    expect(port.log).toEqual(['chooser', 'connect', 'subscribe', 'write f0a10091']);
    await clock.advance(299);
    expect(port.log).toHaveLength(4);
    await clock.advance(1);
    expect(port.log.at(-1)).toBe('write f0a30093');
    await clock.advance(300);
    expect(port.log.at(-1)).toBe('write f0b00101a2');
    await pairing;
    expect(link.pairingRequired()).toBe(false);
    expect(store.state()).toMatchObject({
      ble: 'connected',
      device: 'ECHEX-3-141844',
      device_label: 'ECHEX-3-141844',
      connection_id: '0bf669f1',
      error: null,
    });
  });

  it('writes one at a time, so a command sent during another write waits instead of failing', async () => {
    const { port, store, clock, link } = setUp();
    port.strict = true;
    void link.pair();
    await clock.advance(600);
    // A resistance command and a keepalive meet, as the engine and the keepalive loop do.
    const conn = link.connection()!;
    await Promise.all([
      conn.write(Uint8Array.of(0xf0, 0xb1, 0x01, 0x02, 0xa4)),
      conn.write(Uint8Array.of(0xf0, 0xa0, 0x01, 0x01, 0x92)),
    ]);
    expect(store.state()).toMatchObject({ ble: 'connected', error: null });
    expect(port.log.filter((e) => e.startsWith('write')).slice(-2)).toEqual([
      'write f0b10102a4',
      KEEPALIVE,
    ]);
  });

  it('logs each write to the bike in the packet log, and its packets only on request (L2-095)', async () => {
    const { clock, link } = setUp();
    const log = TestBed.inject(PacketLog);
    void link.pair();
    await clock.advance(600);
    expect(log.view().entries).toBe(3);
    await clock.advance(1000);
    expect(log.view().entries).toBe(4);
  });

  it('goes connecting before connected', async () => {
    const { store, clock, link } = setUp();
    const seen: string[] = [];
    store.subscribe((s) => seen.push(s.ble));
    void link.pair();
    await clock.advance(600);
    expect(seen.filter((b, i) => b !== seen[i - 1])).toEqual([
      'disconnected',
      'connecting',
      'connected',
    ]);
  });

  it('a cancelled chooser changes nothing and pairing stays required (L2-090 AC4)', async () => {
    const { port, store, link } = setUp();
    port.answer = 'cancel';
    await link.pair();
    expect(store.state()).toMatchObject({ ble: 'disconnected', device: null, error: null });
    expect(link.pairingRequired()).toBe(true);
  });

  it('a chooser that cannot open sets ble error with the reason in plain words (L2-090 AC6)', async () => {
    const { port, store, link } = setUp();
    port.answer = 'blocked';
    await link.pair();
    expect(store.state()).toMatchObject({
      ble: 'error',
      error: "The browser didn't open its device list. Press Connect bike again.",
    });
    expect(link.pairingRequired()).toBe(true);
  });

  it('writes the keepalive once per second while connected (L2-091 AC1)', async () => {
    const { port, clock } = await connected();
    expect(port.count(KEEPALIVE)).toBe(0);
    await clock.advance(5000);
    expect(port.count(KEEPALIVE)).toBeGreaterThanOrEqual(4);
    expect(port.count(KEEPALIVE)).toBeLessThanOrEqual(6);
  });

  it('a dropped link goes disconnected, stops the keepalive and retries in 3 s without the chooser (L2-091 AC2)', async () => {
    const { port, clock, store } = await connected();
    port.drop();
    expect(store.state()).toMatchObject({ ble: 'disconnected', device: 'ECHEX-3-141844' });
    const keepalives = port.count(KEEPALIVE);
    await clock.advance(2999);
    expect(port.count('connect')).toBe(1);
    expect(port.count(KEEPALIVE)).toBe(keepalives);
    await clock.advance(1);
    expect(port.count('connect')).toBe(2);
    expect(port.count('chooser')).toBe(1);
    expect(store.state().ble).toBe('connected');
  });

  it('keeps retrying every 3 s until the bike answers', async () => {
    const { port, clock, store } = await connected();
    port.connectFailures.push(
      new DOMException('Connection attempt failed.', 'NetworkError'),
      new DOMException('Connection attempt failed.', 'NetworkError'),
    );
    port.drop();
    await clock.advance(3000);
    expect(store.state()).toMatchObject({
      ble: 'error',
      error: 'NetworkError: Connection attempt failed.',
    });
    await clock.advance(3000);
    expect(port.count('connect')).toBe(3);
    await clock.advance(3000);
    expect(port.count('connect')).toBe(4);
    expect(store.state()).toMatchObject({ ble: 'connected', error: null });
  });

  it('a Web Bluetooth error reads <name>: <message> and retries after 3 s (L2-091 AC3)', async () => {
    const { port, clock, link, store } = setUp();
    port.connectFailures.push(new DOMException('GATT Server is disconnected.', 'NetworkError'));
    await link.pair();
    expect(store.state()).toMatchObject({
      ble: 'error',
      error: 'NetworkError: GATT Server is disconnected.',
    });
    await clock.advance(3000);
    await clock.advance(600);
    expect(store.state()).toMatchObject({ ble: 'connected', error: null });
  });

  it('a connection the bike never answers gives up after 15 s and retries (L2-091 AC3)', async () => {
    const { port, clock, link, store } = setUp();
    port.connectHangs = 1;
    void link.pair();
    await clock.advance(14_999);
    expect(store.state().ble).toBe('connecting');
    await clock.advance(1);
    expect(store.state()).toMatchObject({
      ble: 'error',
      error: 'TimeoutError: The bike did not answer in time.',
    });
    await clock.advance(3000);
    await clock.advance(600);
    expect(store.state()).toMatchObject({ ble: 'connected', error: null });
    expect(port.count('connect')).toBe(2);
  });

  it('Reconnect cancels the pending retry and connects at once (L2-091 AC5)', async () => {
    const { port, clock, link, store } = await connected();
    port.drop();
    await clock.advance(1000);
    expect(await link.reconnect()).toBe('connecting');
    await clock.advance(0);
    expect(port.count('connect')).toBe(2);
    expect(store.state().ble).toBe('connected');
    await clock.advance(5000);
    expect(port.count('connect')).toBe(2);
  });

  it('Reconnect while connected changes nothing (L2-004 AC5)', async () => {
    const { port, link } = await connected();
    expect(await link.reconnect()).toBe('already-connected');
    expect(port.count('connect')).toBe(1);
  });

  describe('unlocking a newer bike (L2-002 AC5 to AC9)', () => {
    const CHALLENGE = 'F0 E0 12 34 56 78 09 ED';
    const RESPONSE = 'write f0e00000020000d2';
    const START = 'write f0b00101a2';
    const writes = (log: string[]) => log.filter((e) => e.startsWith('write') && e !== KEEPALIVE);

    it('answers a challenge, starts the data stream 500 ms later, and init skips its own start', async () => {
      const { port, clock, link } = setUp();
      void link.pair();
      await clock.advance(0);
      port.notify(CHALLENGE);
      await clock.advance(0);
      expect(writes(port.log)).toEqual(['write f0a10091', RESPONSE]);
      await clock.advance(499);
      expect(port.count(START)).toBe(0);
      await clock.advance(1);
      expect(writes(port.log)).toEqual(['write f0a10091', RESPONSE, 'write f0a30093', START]);
      await clock.advance(2000);
      expect(port.count(START)).toBe(1);
    });

    it.each([
      ['workout data', 'F0 D1 09 00 05 00 00 00 00 00 5F 00 1F'],
      ['resistance', 'F0 D2 01 0C CF'],
      ['the acknowledgement', 'F0 A5 01 0E A4'],
    ])('is unlocked by %s within 2.5 s', async (_, frame) => {
      const { port, clock, store } = await connected();
      port.notify(CHALLENGE);
      await clock.advance(2499);
      port.notify(frame);
      await clock.advance(5000);
      expect(store.state()).toMatchObject({ ble: 'connected', error: null });
      expect(port.count('connect')).toBe(1);
    });

    it('fails as a Bluetooth error when nothing confirms within 2.5 s, and retries 3 s later', async () => {
      const { port, clock, store } = await connected();
      port.notify(CHALLENGE);
      await clock.advance(2499);
      expect(store.state().ble).toBe('connected');
      await clock.advance(1);
      expect(store.state()).toMatchObject({
        ble: 'error',
        error: 'UnlockError: The bike did not unlock.',
      });
      expect(port.log.at(-1)).toBe('disconnect');
      await clock.advance(3000);
      expect(port.count('connect')).toBe(2);
      expect(port.count('chooser')).toBe(1);
      expect(store.state().ble).toBe('connected');
    });

    it.each([
      ['too short', 'F0 E0 12 34 56 78 09', 'length'],
      ['without digits', 'F0 E0 12 34 A6 78 09 ED', 'no-digits'],
      ['dividing by 0', 'F0 E0 12 34 56 78 00 E4', 'zero-divisor'],
    ])('leaves a challenge %s unanswered and says why in the console', async (_, frame, why) => {
      const { port, clock, store, warnings } = await connected();
      const before = writes(port.log).length;
      port.notify(frame);
      await clock.advance(5000);
      expect(writes(port.log)).toHaveLength(before);
      expect(store.state()).toMatchObject({ ble: 'connected', error: null });
      expect(warnings.some((w) => w.includes(why))).toBe(true);
    });
  });
});

/// <reference types="web-bluetooth" />
import { Injectable, type OnDestroy, inject, signal } from '@angular/core';
import {
  APP_LOGGER,
  type BikeConnection,
  BikeConnectionError,
  type BikeInfo,
  type BleState,
  PACKET_LOG,
  TICKER,
} from '@telo/api';
import { Subject, firstValueFrom } from 'rxjs';
import { EchelonProtocol } from '../protocol/echelon-protocol';
import { FtmsProtocol } from '../protocol/ftms-protocol';
import type { BikeLink, PacketTap } from './bike-link';
import { bikeIdentity } from './bike-identity';
import { EchelonLink } from './echelon-link';
import { FtmsLink, bytesOf } from './ftms-link';
import { ConsoleAppLogger } from '../diagnostics/console-app-logger';
import { describeError } from './describe-error';
import { DeviceReconnector } from './device-reconnector';
import { GattWriteQueue } from './gatt-write-queue';

/** FTMS (0x1826) and Heart Rate (0x180D), the standard services the chooser offers beside Echelon's. */
const FTMS = 0x1826;
const HEART_RATE = 0x180d;
/**
 * An Echelon advertises its name (`ECH-<model>-<serial>`) and may leave its service out of the advertisement, so the
 * chooser also matches the name. `namePrefix` is case-sensitive, hence the 3 spellings (L2-012 AC1).
 */
const ECHELON_NAMES = [{ namePrefix: 'ECH' }, { namePrefix: 'Ech' }, { namePrefix: 'ech' }];

/**
 * The link to a real bike over Web Bluetooth, the only code that touches `navigator.bluetooth` (AGENTS.md). It opens
 * the chooser filtered to an Echelon's name, the Echelon service and FTMS (L2-012), connects through the link the
 * device's services select, and serialises every write through one `GattWriteQueue`
 * (docs/detailed-designs/bike/connect-a-bike).
 */
@Injectable()
export class WebBluetoothBikeConnection implements BikeConnection, OnDestroy {
  private readonly received = new Subject<Uint8Array>();
  private readonly queue = new GattWriteQueue();
  private readonly ticker = inject(TICKER);
  private readonly reconnector = new DeviceReconnector();
  private readonly logger = inject(APP_LOGGER, { optional: true }) ?? new ConsoleAppLogger();
  private readonly packets = inject(PACKET_LOG, { optional: true });
  /** Every message to and from the bike goes past the packet log (L2-114). */
  private readonly tap: PacketTap = (direction, characteristic, bytes) =>
    this.packets?.record(direction, characteristic, bytes);
  private device: BluetoothDevice | null = null;
  private watched: BluetoothDevice | null = null;
  private link: BikeLink | null = null;
  /** The last target resistance asked for, sent again first after a reconnect (L2-017 AC4). */
  private target: number | null = null;
  private readonly onDisconnected = (): void => this.onDrop();
  private readonly onValue = (event: Event): void => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    if (!value) return;
    const bytes = bytesOf(value);
    this.tap('in', characteristic.uuid, bytes);
    this.received.next(bytes);
  };

  private readonly linkState = signal<BleState>('idle');
  private readonly chosen = signal<BikeInfo | null>(null);
  private readonly failure = signal<string | null>(null);

  readonly frames = this.received.asObservable();
  readonly ble = this.linkState.asReadonly();
  readonly bike = this.chosen.asReadonly();
  /** The last Web Bluetooth error as `name: message`, for the screens to render as text (L2-017 AC5). */
  readonly lastError = this.failure.asReadonly();

  /** Opens the browser's chooser; call it only from the rider's click. A closed chooser resolves `null`. */
  async requestBike(): Promise<BikeInfo | null> {
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [...ECHELON_NAMES, { services: [EchelonProtocol.service] }, { services: [FTMS] }],
        optionalServices: [HEART_RATE],
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') return null;
      const blocked = error instanceof DOMException && error.name === 'SecurityError';
      throw new BikeConnectionError(blocked ? 'blocked' : 'failed', String(error));
    }
    const bike = this.info(this.device);
    this.chosen.set(bike);
    return bike;
  }

  /**
   * Opens GATT, picks the link by the services the bike offers (the Echelon service first, else FTMS), subscribes,
   * initialises, and resolves on the first notification after that (L2-013, L2-014).
   */
  async connect(): Promise<void> {
    if (!this.device?.gatt) throw new BikeConnectionError('failed', 'No bike was chosen');
    this.watch(this.device);
    this.linkState.set('connecting');
    try {
      const link = await this.open(this.device.gatt);
      this.linkState.set('connected');
      link.connected();
    } catch (error) {
      this.report(error);
      this.closeLink();
      this.linkState.set('idle');
      throw error;
    }
  }

  /** Cancels the wait for the next retry and tries the dropped bike at once (L2-017 AC3). */
  reconnectNow(): void {
    if (this.linkState() === 'disconnected') this.reconnector.retryNow();
  }

  /** One attempt: GATT, the link, its initialisation, and the first notification after it. */
  private async open(gatt: BluetoothRemoteGATTServer): Promise<BikeLink> {
    const server = await gatt.connect();
    const services = await server.getPrimaryServices();
    const echelon = services.find((service) => service.uuid === EchelonProtocol.service);
    const ftms = services.find((service) => service.uuid === FtmsProtocol.service);
    const service = echelon ?? ftms;
    if (!service)
      throw new BikeConnectionError(
        'failed',
        'The bike offers neither the Echelon service nor FTMS',
      );
    const link: BikeLink = echelon
      ? new EchelonLink(
          this.queue,
          this.onValue,
          this.ticker,
          (error) => this.onFailure(error),
          this.tap,
        )
      : new FtmsLink(this.queue, this.onValue, this.tap);
    await link.open(service);
    this.link = link;
    await link.initialise();
    await firstValueFrom(this.frames);
    return link;
  }

  /**
   * A drop (`gattserverdisconnected`, or a write that failed while connected): the link closes, which stops the
   * keepalive, `ble` reads `disconnected`, and the same bike is tried every 3 seconds without the chooser (L2-017).
   */
  private onDrop(error?: unknown): void {
    if (error !== undefined) this.report(error);
    if (this.linkState() !== 'connected') return;
    this.closeLink();
    this.linkState.set('disconnected');
    this.reconnector.start(() => this.attempt());
  }

  /** One retry: on success the last target goes before anything else, the keepalive after it (L2-017 AC4). */
  private async attempt(): Promise<boolean> {
    const gatt = this.device?.gatt;
    if (!gatt) return false;
    try {
      const link = await this.open(gatt);
      if (this.target !== null)
        await link.setResistance(this.target).catch((error: unknown) => {
          if (!(error instanceof BikeConnectionError)) throw error;
        });
      this.linkState.set('connected');
      link.connected();
      return true;
    } catch (error) {
      this.report(error);
      this.closeLink();
      return false;
    }
  }

  private watch(device: BluetoothDevice): void {
    if (this.watched === device) return;
    this.watched?.removeEventListener('gattserverdisconnected', this.onDisconnected);
    device.addEventListener('gattserverdisconnected', this.onDisconnected);
    this.watched = device;
  }

  private closeLink(): void {
    this.link?.close();
    this.link = null;
  }

  /** Finds the permitted device by id through `getDevices()` and connects to it; `false` where that cannot work. */
  async reconnectRemembered(bike: BikeInfo): Promise<boolean> {
    if (this.link) return true;
    const bluetooth = 'bluetooth' in navigator ? navigator.bluetooth : undefined;
    if (typeof bluetooth?.getDevices !== 'function') return false;
    try {
      const device = (await bluetooth.getDevices()).find((permitted) => permitted.id === bike.id);
      if (!device) return false;
      this.device = device;
      this.chosen.set(bike);
      await this.connect();
      return true;
    } catch {
      return false;
    }
  }

  async setResistance(level: number): Promise<number> {
    this.target = level;
    if (!this.link) throw new BikeConnectionError('failed', 'The bike is not connected');
    try {
      return await this.link.setResistance(level);
    } catch (error) {
      if (!(error instanceof BikeConnectionError)) this.onDrop(error);
      throw error;
    }
  }

  disconnect(): void {
    this.reconnector.stop();
    this.closeLink();
    this.linkState.set('idle');
    this.device?.gatt?.disconnect();
  }

  /** A keepalive that failed while connected counts as a drop (L2-017 AC1). */
  private onFailure(error: unknown): void {
    this.onDrop(error);
  }

  /**
   * A Web Bluetooth error's name and message go to `lastError` as text, and to the console with its area (L2-017 AC5,
   * L2-115 AC3).
   */
  private report(error: unknown): void {
    this.failure.set(describeError(error));
    this.logger.error('bluetooth', error);
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.watched?.removeEventListener('gattserverdisconnected', this.onDisconnected);
    this.received.complete();
  }

  private info(device: BluetoothDevice): BikeInfo {
    const { name, identifier } = bikeIdentity(device.name, device.id);
    return { id: device.id, name, identifier, kind: identifier ? 'echelon' : 'ftms' };
  }
}

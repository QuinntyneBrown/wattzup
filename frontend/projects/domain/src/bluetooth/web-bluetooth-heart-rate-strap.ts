/// <reference types="web-bluetooth" />
import { Injectable, type OnDestroy, inject, signal } from '@angular/core';
import { APP_LOGGER, type HeartRateStrap, type StrapState } from '@telo/api';
import { HeartRateMeasurementDecoder } from '../protocol/heart-rate-measurement-decoder';
import { RememberedStrapStore } from '../storage/remembered-strap-store';
import { ConsoleAppLogger } from '../diagnostics/console-app-logger';
import { DeviceReconnector } from './device-reconnector';

/** How long the bpm stays shown without a new measurement (L2-031 AC4). */
export const STRAP_QUIET_MS = 5000;

/**
 * A heart-rate strap over Web Bluetooth (docs/detailed-designs/bike/show-heart-rate). `choose()` opens the chooser
 * filtered to the Heart Rate service and remembers the strap (L2-031 AC1); a connection subscribes to Heart Rate
 * Measurement (AC2); `reconnectRemembered()` finds the strap through `getDevices()` without the chooser (AC3). On a
 * drop it reads `disconnected`, blanks the bpm and tries the strap every 3 seconds until it is back (AC4); 5 seconds
 * without a measurement blank the bpm too. Errors go to the console as `name: message`. It releases its listeners,
 * timer and retries when destroyed.
 */
@Injectable()
export class WebBluetoothHeartRateStrap implements HeartRateStrap, OnDestroy {
  private readonly store = inject(RememberedStrapStore);
  private readonly logger = inject(APP_LOGGER, { optional: true }) ?? new ConsoleAppLogger();
  private readonly reconnector = new DeviceReconnector();
  private device: BluetoothDevice | null = null;
  private measurement: BluetoothRemoteGATTCharacteristic | null = null;
  private quiet: ReturnType<typeof setTimeout> | undefined;
  private readonly link = signal<StrapState>('none');
  private readonly chosen = signal<string | null>(null);
  private readonly beats = signal<number | null>(null);

  readonly state = this.link.asReadonly();
  readonly name = this.chosen.asReadonly();
  readonly bpm = this.beats.asReadonly();

  private readonly onMeasurement = (event: Event): void => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    const bpm = value
      ? HeartRateMeasurementDecoder.decode(
          new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
        )
      : null;
    if (bpm === null) return;
    this.beats.set(bpm);
    clearTimeout(this.quiet);
    this.quiet = setTimeout(() => this.beats.set(null), STRAP_QUIET_MS);
  };
  private readonly onDisconnected = (): void => this.onDrop();

  async choose(): Promise<boolean> {
    let device: BluetoothDevice;
    try {
      device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HeartRateMeasurementDecoder.service] }],
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'NotFoundError'))
        this.logger.error('heart rate', error);
      return false;
    }
    this.use(device);
    this.store.save({ id: device.id, name: this.chosen() ?? '' });
    return this.connect();
  }

  async reconnectRemembered(): Promise<boolean> {
    if (this.link() === 'connected') return true;
    const remembered = this.store.get();
    const bluetooth = 'bluetooth' in navigator ? navigator.bluetooth : undefined;
    if (!remembered || typeof bluetooth?.getDevices !== 'function') return false;
    try {
      const device = (await bluetooth.getDevices()).find((d) => d.id === remembered.id);
      if (!device) return false;
      this.use(device);
      return await this.connect();
    } catch (error) {
      this.logger.error('heart rate', error);
      return false;
    }
  }

  disconnect(): void {
    this.reconnector.stop();
    this.release();
    this.device?.gatt?.disconnect();
    this.link.set('none');
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.device?.removeEventListener('gattserverdisconnected', this.onDisconnected);
  }

  private use(device: BluetoothDevice): void {
    if (this.device !== device) {
      this.device?.removeEventListener('gattserverdisconnected', this.onDisconnected);
      device.addEventListener('gattserverdisconnected', this.onDisconnected);
      this.device = device;
    }
    this.chosen.set(device.name ?? 'Heart-rate strap');
  }

  private async connect(): Promise<boolean> {
    this.link.set('connecting');
    const opened = await this.open();
    this.link.set(opened ? 'connected' : 'none');
    return opened;
  }

  /** One attempt: GATT, the Heart Rate service, and the measurement's notifications. */
  private async open(): Promise<boolean> {
    const gatt = this.device?.gatt;
    if (!gatt) return false;
    try {
      const server = await gatt.connect();
      const service = await server.getPrimaryService(HeartRateMeasurementDecoder.service);
      const measurement = await service.getCharacteristic(HeartRateMeasurementDecoder.measurement);
      measurement.addEventListener('characteristicvaluechanged', this.onMeasurement);
      await measurement.startNotifications();
      this.measurement = measurement;
      return true;
    } catch (error) {
      this.logger.error('heart rate', error);
      this.release();
      return false;
    }
  }

  private onDrop(): void {
    if (this.link() !== 'connected') return;
    this.release();
    this.link.set('disconnected');
    this.reconnector.start(async () => {
      const opened = await this.open();
      if (opened) this.link.set('connected');
      return opened;
    });
  }

  private release(): void {
    this.measurement?.removeEventListener('characteristicvaluechanged', this.onMeasurement);
    this.measurement = null;
    clearTimeout(this.quiet);
    this.beats.set(null);
  }
}

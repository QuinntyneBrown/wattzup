/// <reference types="web-bluetooth" />
import { EchelonProtocol } from '../protocol/echelon-protocol';
import type { Ticker } from '@telo/api';
import { type BikeLink, NO_TAP, type PacketTap } from './bike-link';
import type { GattWriteQueue } from './gatt-write-queue';
import { KeepaliveScheduler } from './keepalive-scheduler';

/**
 * The link to an Echelon bike (L2-013): it subscribes to the notify characteristic before writing anything, then
 * writes the three initialisation commands in order, each with response and at least 300 ms after the one before.
 */
export class EchelonLink implements BikeLink {
  private notifications: BluetoothRemoteGATTCharacteristic | null = null;
  private writer: BluetoothRemoteGATTCharacteristic | null = null;

  private readonly keepalive: KeepaliveScheduler;

  constructor(
    private readonly queue: GattWriteQueue,
    private readonly onValue: (event: Event) => void,
    ticker: Ticker,
    onFailure: (error: unknown) => void,
    private readonly tap: PacketTap = NO_TAP,
  ) {
    this.keepalive = new KeepaliveScheduler(
      ticker,
      () => this.write(EchelonProtocol.keepalive()),
      onFailure,
    );
  }

  async open(service: BluetoothRemoteGATTService): Promise<void> {
    this.notifications = await service.getCharacteristic(EchelonProtocol.notify);
    this.notifications.addEventListener('characteristicvaluechanged', this.onValue);
    await this.notifications.startNotifications();
    this.writer = await service.getCharacteristic(EchelonProtocol.write);
  }

  async initialise(): Promise<void> {
    const [first, ...rest] = EchelonProtocol.initCommands();
    await this.write(first);
    for (const command of rest) await this.write(command, EchelonProtocol.initGapMs);
  }

  /** The keepalive starts once the bike is connected and initialised (L2-016 AC1). */
  connected(): void {
    this.keepalive.start();
  }

  setResistance(level: number): Promise<number> {
    return this.write(EchelonProtocol.setResistance(level));
  }

  close(): void {
    this.keepalive.stop();
    this.notifications?.removeEventListener('characteristicvaluechanged', this.onValue);
    this.notifications = null;
    this.writer = null;
  }

  private write(bytes: Uint8Array<ArrayBuffer>, gapMs = 0): Promise<number> {
    const writer = this.writer;
    if (!writer) return Promise.reject(new Error('The bike is not connected'));
    return this.queue.enqueue(() => {
      this.tap('out', EchelonProtocol.write, bytes);
      return writer.writeValueWithResponse(bytes);
    }, gapMs);
  }
}

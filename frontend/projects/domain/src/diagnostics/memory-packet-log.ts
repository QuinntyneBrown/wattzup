import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { APP_LOGGER, type PacketDirection, type PacketLog } from '@telo/api';
import { toHex } from '../protocol/echelon-protocol';
import { packetFrame } from '../protocol/packet-frame';
import { ConsoleAppLogger } from './console-app-logger';
import { packetLogFileName } from './packet-log-summary';

/** The packet log's bound (L2-114 AC4): past this, the oldest entries go. */
export const PACKET_LOG_LIMIT_BYTES = 10 * 1024 * 1024;

interface Entry {
  readonly line: string;
  readonly incoming: boolean;
}

/**
 * The packet log on this device (docs/detailed-designs/diagnostics/record-the-packet-log): each kept packet as its
 * JSON line, in a window of at most 10 MB that drops the oldest first, so a ride of any length holds a bounded log.
 * Commands only by default; every packet both ways while "Log every packet" is on, each also written to the console.
 * Nothing here leaves the device but the file the rider saves.
 */
@Injectable()
export class MemoryPacketLog implements PacketLog {
  private readonly document = inject(DOCUMENT);
  private readonly logger = inject(APP_LOGGER, { optional: true }) ?? new ConsoleAppLogger();
  private entries: Entry[] = [];
  /** The first entry still kept: dropping moves it on, and the array is compacted now and then. */
  private head = 0;
  private incoming = 0;
  private readonly on = signal(false);
  private readonly kept = signal(0);
  private readonly size = signal(0);
  private readonly fromBike = signal(false);

  readonly everyPacket = this.on.asReadonly();
  readonly count = this.kept.asReadonly();
  readonly bytes = this.size.asReadonly();
  readonly holdsIncoming = this.fromBike.asReadonly();

  setEveryPacket(on: boolean): void {
    this.on.set(on);
  }

  record(direction: PacketDirection, characteristic: string, bytes: Uint8Array): void {
    const incoming = direction === 'in';
    if (incoming && !this.on()) return;
    const frame = packetFrame(characteristic, bytes);
    const hex = toHex(bytes);
    const line = JSON.stringify({ time: new Date().toISOString(), direction, frame, hex });
    this.entries.push({ line, incoming });
    if (incoming) this.incoming++;
    let size = this.size() + line.length + 1;
    while (size > PACKET_LOG_LIMIT_BYTES && this.head < this.entries.length) {
      const dropped = this.entries[this.head++];
      size -= dropped.line.length + 1;
      if (dropped.incoming) this.incoming--;
    }
    if (this.head > 4096 && this.head * 2 > this.entries.length) {
      this.entries = this.entries.slice(this.head);
      this.head = 0;
    }
    this.size.set(size);
    this.kept.set(this.entries.length - this.head);
    this.fromBike.set(this.incoming > 0);
    if (this.on()) this.logger.packet(direction, frame, hex);
  }

  download(): void {
    const lines: string[] = [];
    for (let i = this.head; i < this.entries.length; i++) lines.push(this.entries[i].line, '\n');
    const view = this.document.defaultView;
    if (!view) return;
    const url = view.URL.createObjectURL(new Blob(lines, { type: 'application/jsonl' }));
    const link = this.document.createElement('a');
    link.href = url;
    link.download = packetLogFileName(new Date());
    link.click();
    // The download has the file by the next task; the URL goes then, so the Blob is not held.
    view.setTimeout(() => view.URL.revokeObjectURL(url), 0);
  }
}

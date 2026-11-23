import { InjectionToken, type Signal } from '@angular/core';

/** A packet's way: `out` to the bike (a command), `in` from it (a notification or an indication). */
export type PacketDirection = 'out' | 'in';

/**
 * The packet log (L2-114): the commands sent to the bike, or every message both ways while "Log every packet" is on,
 * kept on this device up to 10 MB, oldest dropped first, and saved as JSON Lines when the rider asks. It never leaves
 * the device but in a feedback report the rider sends with diagnostics attached (L2-117).
 */
export interface PacketLog {
  /** "Log every packet": off by default, and off again when the app starts. */
  readonly everyPacket: Signal<boolean>;
  /** The entries kept. */
  readonly count: Signal<number>;
  /** The entries' size as JSON Lines, in bytes. */
  readonly bytes: Signal<number>;
  /** Whether the bike's messages are among them, or only commands. */
  readonly holdsIncoming: Signal<boolean>;
  setEveryPacket(on: boolean): void;
  /** One message on `characteristic`, as the Bluetooth link sent or received it. */
  record(direction: PacketDirection, characteristic: string, bytes: Uint8Array): void;
  /** Saves the log, oldest first, as `telo-ride-packets-{YYYY-MM-DD}.jsonl` (L2-114 AC3). */
  download(): void;
}

export const PACKET_LOG = new InjectionToken<PacketLog>('PacketLog');

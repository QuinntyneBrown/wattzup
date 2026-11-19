// The "Sent to bike" entries (L2-048).
import type { CommandEntry } from '@wattzup/api';
import type { CommandLogEntry } from '@wattzup/components';
import { formatDuration } from './format-duration';

/** The panel's title and entries. */
export function commandLogView(
  commands: readonly CommandEntry[],
  localTime: (epochSeconds: number) => string,
): { title: string; entries: CommandLogEntry[] } {
  return {
    title: 'Sent to bike',
    entries: commands.map((c, i) => ({
      key: `${c.at}-${c.level}-${i}`,
      time: commandTime(c, localTime),
      label: commandLabel(c),
      source: c.source,
      status: c.status,
      text: statusText(c),
    })),
  };
}

export function commandTime(
  entry: CommandEntry,
  localTime: (epochSeconds: number) => string,
): string {
  return entry.ride_seconds === null ? localTime(entry.at) : formatDuration(entry.ride_seconds);
}

/** `RES 18`. */
export function commandLabel(entry: CommandEntry): string {
  return `RES ${entry.level}`;
}

export function statusText(entry: CommandEntry): string {
  if (entry.status === 'ack') return `ack ${entry.ack_ms}ms`;
  return entry.status;
}

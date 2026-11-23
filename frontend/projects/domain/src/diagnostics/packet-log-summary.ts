/** The packet log's count line (L2-114 AC1, AC2): "212 commands · 20 KB", or "1,284 packets · 186 KB" and Recording. */
export interface PacketLogSummary {
  readonly figure: string;
  /** " commands · 20 KB", after the figure. */
  readonly unit: string;
  readonly recording: boolean;
}

const KB = 1024;
const MB = 1024 * 1024;

/** The log's size: "0 KB", whole kilobytes rounded up below a megabyte, then "1.2 MB". */
export function sizeLabel(bytes: number): string {
  return bytes < MB ? `${Math.ceil(bytes / KB)} KB` : `${(bytes / MB).toFixed(1)} MB`;
}

/**
 * The count line: the entries, called commands while only commands are kept and packets once the bike's messages are
 * among them, and the size; Recording while "Log every packet" is on.
 */
export function packetLogSummary(
  count: number,
  bytes: number,
  holdsIncoming: boolean,
  recording: boolean,
): PacketLogSummary {
  const noun = recording || holdsIncoming ? 'packet' : 'command';
  return {
    figure: count.toLocaleString('en-US'),
    unit: ` ${noun}${count === 1 ? '' : 's'} · ${sizeLabel(bytes)}`,
    recording,
  };
}

/** "telo-ride-packets-2026-11-22.jsonl", by the device's own date (L2-114 AC3). */
export function packetLogFileName(now: Date): string {
  const day = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-');
  return `telo-ride-packets-${day}.jsonl`;
}

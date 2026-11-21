// The bytes written to the bike (L2-002, L2-003,
// L2-008).
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 32;

/** Start data stream: the last init command, and the step after an unlock (L2-002). */
export const START_DATA = Uint8Array.of(0xf0, 0xb0, 0x01, 0x01, 0xa2);

/** Device info, resistance range, then start data stream, in that order (L2-002). */
export const INIT_SEQUENCE: readonly Uint8Array[] = [
  Uint8Array.of(0xf0, 0xa1, 0x00, 0x91),
  Uint8Array.of(0xf0, 0xa3, 0x00, 0x93),
  START_DATA,
];

/** Written once per second while connected (L2-003). */
export const KEEPALIVE = Uint8Array.of(0xf0, 0xa0, 0x01, 0x01, 0x92);

/** `F0 B1 01 <level> <checksum>` (L2-008). */
export function setResistance(level: number): Uint8Array {
  if (!Number.isInteger(level) || level < MIN_LEVEL || level > MAX_LEVEL) {
    throw new RangeError(`level must be ${MIN_LEVEL} to ${MAX_LEVEL}, was ${level}`);
  }
  const body = [0xf0, 0xb1, 0x01, level];
  return Uint8Array.of(...body, checksum(Uint8Array.from(body)));
}

/** The sum of the bytes, masked to 8 bits. */
export function checksum(bytes: Uint8Array): number {
  return bytes.reduce((sum, b) => sum + b, 0) & 0xff;
}

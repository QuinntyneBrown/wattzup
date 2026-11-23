// The Echelon frames (docs/protocol/echelon-ble-frames.md): F0, a type, a length, the payload, and a checksum that
// is the sum of the bytes before it, mod 256. The encoders and the parser share that one definition, so a round trip
// is testable.

const MARKER = 0xf0;
const WORKOUT = 0xd1;
const RESISTANCE = 0xd2;
const SET_RESISTANCE = 0xb1;

/** The lowest and highest target resistance (L2-025 AC2). */
export const MIN_RESISTANCE = 1;
export const MAX_RESISTANCE = 32;

/** What a `D1` frame carries (L2-007). */
export interface WorkoutData {
  readonly elapsedSeconds: number;
  readonly revolutions: number;
  readonly cadence: number;
}

function frame(type: number, payload: readonly number[]): Uint8Array<ArrayBuffer> {
  const bytes = [MARKER, type, payload.length, ...payload];
  return Uint8Array.from([...bytes, bytes.reduce((sum, b) => sum + b, 0) % 256]);
}

function valid(bytes: Uint8Array, type: number, length: number): boolean {
  if (
    bytes.length !== length + 4 ||
    bytes[0] !== MARKER ||
    bytes[1] !== type ||
    bytes[2] !== length
  )
    return false;
  const sum = bytes.subarray(0, bytes.length - 1).reduce((total, b) => total + b, 0) % 256;
  return sum === bytes[bytes.length - 1];
}

const clamp = (level: number): number =>
  Math.min(MAX_RESISTANCE, Math.max(MIN_RESISTANCE, Math.round(level)));

export const EchelonProtocol = {
  /** The Echelon GATT service and its two characteristics (L2-011, L2-012). */
  service: '0bf669f1-45f2-11e7-9598-0800200c9a66',
  write: '0bf669f2-45f2-11e7-9598-0800200c9a66',
  notify: '0bf669f4-45f2-11e7-9598-0800200c9a66',

  /** The initialisation, in order (L2-013 AC2): `A1` device info, `A3` resistance range, `B0` start the data stream. */
  initCommands(): Uint8Array<ArrayBuffer>[] {
    return [frame(0xa1, []), frame(0xa3, []), frame(0xb0, [0x01])];
  },

  /** `A0`: the keepalive the bike needs about once a second while connected (L2-016). */
  keepalive(): Uint8Array<ArrayBuffer> {
    return frame(0xa0, [0x01]);
  },

  /** The least time between two initialisation writes (L2-013 AC2). */
  initGapMs: 300,

  /** `B1`: set the target resistance, clamped to 1 to 32 (L2-025 AC1, AC2). */
  setResistance(level: number): Uint8Array<ArrayBuffer> {
    return frame(SET_RESISTANCE, [clamp(level)]);
  },

  /** The level a `B1` command carries, or `null` when the bytes are not a valid `B1` frame. */
  parseSetResistance(bytes: Uint8Array): number | null {
    return valid(bytes, SET_RESISTANCE, 1) ? bytes[3] : null;
  },

  /** `D1`: elapsed seconds (uint16 BE), cumulative revolutions (uint32 BE), cadence in rpm (uint16 BE), then `00`. */
  workout({ elapsedSeconds, revolutions, cadence }: WorkoutData): Uint8Array<ArrayBuffer> {
    const be = (value: number, size: number) =>
      Array.from({ length: size }, (_, i) => (value >>> (8 * (size - 1 - i))) & 0xff);
    return frame(WORKOUT, [
      ...be(elapsedSeconds, 2),
      ...be(revolutions, 4),
      ...be(cadence, 2),
      0x00,
    ]);
  },

  /** `D2`: the bike's current resistance level (L2-006). */
  resistance(level: number): Uint8Array<ArrayBuffer> {
    return frame(RESISTANCE, [clamp(level)]);
  },
} as const;

/** Upper-case hex bytes separated by spaces, as the protocol documents them ("F0 B1 01 0C AE"). */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

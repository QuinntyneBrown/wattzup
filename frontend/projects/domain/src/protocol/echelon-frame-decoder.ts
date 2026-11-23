import type { TelemetrySample } from '@telo/api';

// The frames an Echelon notifies (docs/protocol/echelon-ble-frames.md): F0, a type, a length, the payload, a checksum.
const MARKER = 0xf0;
const WORKOUT = 0xd1;
const RESISTANCE = 0xd2;
const WORKOUT_LENGTH = 13;

/**
 * Decodes an Echelon notification into a `TelemetrySample` (L2-020): a `D2` frame's byte 3 is the resistance, a `D1`
 * frame's bytes 9 and 10 the cadence in rpm, big-endian. Anything else (a frame under 4 bytes, a byte 0 other than
 * `F0`, an unknown type, a `D1` under 13 bytes, every `D0`) is `null`, never an error. Incoming checksums are not
 * checked, as the protocol document records.
 */
export const EchelonFrameDecoder = {
  decode(bytes: Uint8Array, at: number): TelemetrySample | null {
    if (bytes.length < 4 || bytes[0] !== MARKER) return null;
    switch (bytes[1]) {
      case RESISTANCE:
        return { at, resistance: bytes[3] };
      case WORKOUT:
        return bytes.length < WORKOUT_LENGTH ? null : { at, cadence: (bytes[9] << 8) | bytes[10] };
      default:
        return null;
    }
  },
} as const;

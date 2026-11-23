import { MAX_RESISTANCE, MIN_RESISTANCE } from './echelon-protocol';

/** The resistance range an FTMS bike supports (`0x2AD6`), in its raw unit of 0.1. */
export interface ResistanceRange {
  readonly minimum: number;
  readonly maximum: number;
  readonly increment: number;
}

/** A Fitness Machine Control Point response (`0x80`, request op code, result code). */
export interface ControlPointResponse {
  readonly requestOpCode: number;
  readonly success: boolean;
}

const uuid16 = (short: number): string =>
  `0000${short.toString(16).padStart(4, '0')}-0000-1000-8000-00805f9b34fb`;

const REQUEST_CONTROL = 0x00;
const SET_TARGET_RESISTANCE_LEVEL = 0x04;
const RESPONSE = 0x80;
const SUCCESS = 0x01;

/**
 * The Bluetooth SIG Fitness Machine Service as Telo Ride uses it (L2-014): the UUIDs, the control point commands and
 * responses, and the mapping of levels 1 to 32 onto the bike's range. Every multi-byte field is little-endian; a
 * resistance level is a sint16 in 0.1, the same encoding as the range it is chosen from.
 */
export const FtmsProtocol = {
  service: uuid16(0x1826),
  indoorBikeData: uuid16(0x2ad2),
  controlPoint: uuid16(0x2ad9),
  resistanceRange: uuid16(0x2ad6),

  requestControl(): Uint8Array<ArrayBuffer> {
    return Uint8Array.of(REQUEST_CONTROL);
  },

  setTargetResistanceLevel(raw: number): Uint8Array<ArrayBuffer> {
    const bytes = new Uint8Array(3);
    const view = new DataView(bytes.buffer);
    view.setUint8(0, SET_TARGET_RESISTANCE_LEVEL);
    view.setInt16(1, raw, true);
    return bytes;
  },

  /** `null` when the bytes are not a control point response. */
  decodeControlPointResponse(view: DataView): ControlPointResponse | null {
    if (view.byteLength < 3 || view.getUint8(0) !== RESPONSE) return null;
    return { requestOpCode: view.getUint8(1), success: view.getUint8(2) === SUCCESS };
  },

  decodeResistanceRange(view: DataView): ResistanceRange {
    return {
      minimum: view.getInt16(0, true),
      maximum: view.getInt16(2, true),
      increment: view.getUint16(4, true),
    };
  },

  /** Level 1 is the minimum, level 32 the maximum, the levels between spaced linearly and rounded to the increment. */
  mapLevel(level: number, range: ResistanceRange): number {
    const clamped = Math.min(MAX_RESISTANCE, Math.max(MIN_RESISTANCE, Math.round(level)));
    const span = range.maximum - range.minimum;
    const exact =
      range.minimum + ((clamped - MIN_RESISTANCE) * span) / (MAX_RESISTANCE - MIN_RESISTANCE);
    const step = range.increment > 0 ? range.increment : 1;
    const rounded = range.minimum + Math.round((exact - range.minimum) / step) * step;
    return Math.min(range.maximum, rounded);
  },
} as const;

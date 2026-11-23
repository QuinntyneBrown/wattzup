import type { TelemetrySample } from '@telo/api';

type Metric = 'speedKmh' | 'cadence' | 'powerW' | 'heartRate';

/** One Indoor Bike Data field, in specification order: its flag bit, its size, and how Telo Ride reads it, if at all. */
interface Field {
  readonly bit: number;
  readonly size: number;
  readonly read?: {
    readonly metric: Metric;
    readonly value: (view: DataView, at: number) => number;
  };
}

const uint16 = (scale: number) => (view: DataView, at: number) => view.getUint16(at, true) * scale;

// FTMS Indoor Bike Data (0x2AD2). Bit 0 is "More Data": instantaneous speed is present when it is clear.
const FIELDS: readonly Field[] = [
  { bit: 0, size: 2, read: { metric: 'speedKmh', value: uint16(0.01) } },
  { bit: 1, size: 2 }, // average speed
  { bit: 2, size: 2, read: { metric: 'cadence', value: uint16(0.5) } },
  { bit: 3, size: 2 }, // average cadence
  { bit: 4, size: 3 }, // total distance
  { bit: 5, size: 2 }, // resistance level
  { bit: 6, size: 2, read: { metric: 'powerW', value: (view, at) => view.getInt16(at, true) } },
  { bit: 7, size: 2 }, // average power
  { bit: 8, size: 5 }, // expended energy: total, per hour, per minute
  { bit: 9, size: 1, read: { metric: 'heartRate', value: (view, at) => view.getUint8(at) } },
];

const present = (flags: number, bit: number): boolean =>
  bit === 0 ? (flags & 1) === 0 : (flags & (1 << bit)) !== 0;

/**
 * Decodes FTMS Indoor Bike Data into a `TelemetrySample` (L2-021 AC1): speed uint16 in 0.01 km/h, cadence uint16 in
 * 0.5 rpm, power sint16 in W and heart rate uint8 in bpm, each read only when the flags mark it present. The fields
 * between are skipped by size; a field that runs past the end is left undefined, and a notification too short for
 * its flags is `null`, never an error.
 */
export const IndoorBikeDataDecoder = {
  decode(bytes: Uint8Array, at: number): TelemetrySample | null {
    if (bytes.length < 2) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const flags = view.getUint16(0, true);
    const sample: { -readonly [K in keyof TelemetrySample]: TelemetrySample[K] } = { at };
    let offset = 2;
    for (const field of FIELDS) {
      if (!present(flags, field.bit)) continue;
      if (offset + field.size > bytes.length) break;
      if (field.read) sample[field.read.metric] = field.read.value(view, offset);
      offset += field.size;
    }
    return sample;
  },
} as const;

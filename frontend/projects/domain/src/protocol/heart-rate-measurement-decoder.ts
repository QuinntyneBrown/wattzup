/**
 * The Heart Rate service (`0x180D`) and its Heart Rate Measurement characteristic (`0x2A37`): bpm is a uint8 after
 * the flags when bit 0 is clear, a little-endian uint16 when it is set (L2-031 AC2). A notification too short for
 * its value is `null`, never an error.
 */
export const HeartRateMeasurementDecoder = {
  service: 0x180d,
  measurement: 0x2a37,
  decode(bytes: Uint8Array): number | null {
    const wide = (bytes[0] & 0x01) === 1;
    if (bytes.length < (wide ? 3 : 2)) return null;
    return wide ? bytes[1] | (bytes[2] << 8) : bytes[1];
  },
} as const;

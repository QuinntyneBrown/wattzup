// Unit test (the slice's acceptance table: no screen shows heart rate until the ride screens)
// Traces to: L2-031 AC2
// Description: Heart Rate Measurement (0x2A37) carries bpm as a uint8 when bit 0 of its flags is clear, and as a
// little-endian uint16 when it is set; a notification too short for its value is ignored. One case per row.
import { HeartRateMeasurementDecoder } from './heart-rate-measurement-decoder';

describe('HeartRateMeasurementDecoder', () => {
  it.each([
    ['a uint8 when bit 0 is clear', [0x00, 142], 142],
    ['a uint8, other flags set', [0x16, 98, 0x20, 0x03], 98],
    ['a little-endian uint16 when bit 0 is set', [0x01, 0x2c, 0x01], 300],
    ['a uint16 below 256', [0x01, 151, 0x00], 151],
  ])('reads bpm as %s', (_, bytes, bpm) => {
    expect(HeartRateMeasurementDecoder.decode(Uint8Array.from(bytes))).toBe(bpm);
  });

  it.each([
    ['empty', []],
    ['flags only', [0x00]],
    ['a uint16 cut short', [0x01, 0x2c]],
  ])('ignores a notification that is %s', (_, bytes) => {
    expect(HeartRateMeasurementDecoder.decode(Uint8Array.from(bytes))).toBeNull();
  });

  it('names the GATT service and characteristic the strap is chosen and read by', () => {
    expect(HeartRateMeasurementDecoder.service).toBe(0x180d);
    expect(HeartRateMeasurementDecoder.measurement).toBe(0x2a37);
  });
});

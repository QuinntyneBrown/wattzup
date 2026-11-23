// Unit test (the slice's acceptance table: no screen shows telemetry until slice 3.2)
// Traces to: L2-021 AC1
// Description: FTMS Indoor Bike Data decodes by its flags: speed uint16 in 0.01 km/h (present when bit 0 is clear),
// cadence uint16 in 0.5 rpm, power sint16 in W, heart rate uint8 in bpm; the fields between are skipped by size, and a
// field the flags mark absent, or that runs past the end, is left undefined. One case per row.
import { IndoorBikeDataDecoder } from './indoor-bike-data-decoder';

const AT = 1_700_000_000_000;
const u8 = (value: number) => [value & 0xff];
const u16 = (value: number) => [value & 0xff, (value >> 8) & 0xff];
const u24 = (value: number) => [...u16(value), (value >> 16) & 0xff];
/** A notification: the flags (uint16, little-endian), then the fields as given. */
const data = (flags: number, ...fields: number[][]) =>
  Uint8Array.from([...u16(flags), ...fields.flat()]);

const MORE_DATA = 1 << 0;
const AVERAGE_SPEED = 1 << 1;
const CADENCE = 1 << 2;
const AVERAGE_CADENCE = 1 << 3;
const DISTANCE = 1 << 4;
const RESISTANCE = 1 << 5;
const POWER = 1 << 6;
const AVERAGE_POWER = 1 << 7;
const ENERGY = 1 << 8;
const HEART_RATE = 1 << 9;

describe('IndoorBikeDataDecoder', () => {
  it.each([
    ['speed only (bit 0 clear)', data(0, u16(3000)), { speedKmh: 30 }],
    [
      'speed, cadence and power',
      data(CADENCE | POWER, u16(2845), u16(161), u16(212)),
      { speedKmh: 28.45, cadence: 80.5, powerW: 212 },
    ],
    [
      'no speed when bit 0 (More Data) is set',
      data(MORE_DATA | CADENCE, u16(160)),
      { cadence: 80 },
    ],
    ['a negative power, as sint16', data(MORE_DATA | POWER, u16(0xfff6)), { powerW: -10 }],
    ['heart rate as uint8', data(MORE_DATA | HEART_RATE, u8(142)), { heartRate: 142 }],
    [
      'every field, the unused ones skipped by size',
      data(
        AVERAGE_SPEED |
          CADENCE |
          AVERAGE_CADENCE |
          DISTANCE |
          RESISTANCE |
          POWER |
          AVERAGE_POWER |
          ENERGY |
          HEART_RATE,
        u16(2500), // speed
        u16(2400), // average speed
        u16(180), // cadence
        u16(170), // average cadence
        u24(12_345), // total distance
        u16(14), // resistance level
        u16(250), // power
        u16(230), // average power
        [...u16(120), ...u16(600), ...u8(10)], // expended energy: total, per hour, per minute
        u8(151), // heart rate
      ),
      { speedKmh: 25, cadence: 90, powerW: 250, heartRate: 151 },
    ],
  ])('decodes %s (AC1)', (_, bytes, fields) => {
    expect(IndoorBikeDataDecoder.decode(bytes, AT)).toEqual({ at: AT, ...fields });
  });

  it('leaves a field that runs past the end undefined, without an error', () => {
    const truncated = data(CADENCE | POWER, u16(3000), u16(160), [0xc8]);

    expect(IndoorBikeDataDecoder.decode(truncated, AT)).toEqual({
      at: AT,
      speedKmh: 30,
      cadence: 80,
    });
  });

  it('ignores a notification too short to hold its flags', () => {
    expect(IndoorBikeDataDecoder.decode(Uint8Array.from([0x44]), AT)).toBeNull();
  });
});

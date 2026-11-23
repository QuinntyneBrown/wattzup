import type { FakeBike } from './fake-bluetooth';

// The Fitness Machine Service as a browser names it: 16-bit SIG UUIDs in their full 128-bit form.
const sig = (short: number) =>
  `0000${short.toString(16).padStart(4, '0')}-0000-1000-8000-00805f9b34fb`;
export const FTMS_SERVICE = sig(0x1826);
export const INDOOR_BIKE_DATA = sig(0x2ad2);
export const CONTROL_POINT = sig(0x2ad9);
export const RESISTANCE_RANGE = sig(0x2ad6);

/** An FTMS smart bike from another maker, with a resistance range of 1.0 to 100.0 in steps of 1.0. */
export const ftmsBike: FakeBike = {
  name: 'KICKR BIKE 1A2B',
  services: { [FTMS_SERVICE]: [INDOOR_BIKE_DATA, CONTROL_POINT, RESISTANCE_RANGE] },
  values: { [RESISTANCE_RANGE]: [0x0a, 0x00, 0xe8, 0x03, 0x0a, 0x00] },
};

/** An Indoor Bike Data frame: speed 20.00 km/h, cadence 80 rpm (flags 0x0004). */
export const INDOOR_BIKE_FRAME = [0x04, 0x00, 0xd0, 0x07, 0xa0, 0x00];

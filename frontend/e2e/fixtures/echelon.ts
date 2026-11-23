import type { FakeBike } from './fake-bluetooth';

// The Echelon GATT identifiers (L2.md, Pair a bike and Initialise the bike).
export const ECHELON_SERVICE = '0bf669f1-45f2-11e7-9598-0800200c9a66';
export const ECHELON_WRITE = '0bf669f2-45f2-11e7-9598-0800200c9a66';
export const ECHELON_NOTIFY = '0bf669f4-45f2-11e7-9598-0800200c9a66';

/** An Echelon EX-5s as the fake Bluetooth stack offers it. */
export const echelonBike: FakeBike = {
  name: 'ECH-EX5S-141844',
  card: { name: 'Echelon EX-5s', identifier: 'EX5S-141844' },
  services: { [ECHELON_SERVICE]: [ECHELON_WRITE, ECHELON_NOTIFY] },
};

const withChecksum = (bytes: number[]): number[] => [
  ...bytes,
  bytes.reduce((sum, byte) => sum + byte, 0) % 256,
];

/** A `D1` workout frame reporting `cadence` rpm (docs/protocol/echelon-ble-frames.md). */
export const workoutFrame = (cadence: number): number[] =>
  withChecksum([
    0xf0,
    0xd1,
    0x09,
    0x00,
    0x05,
    0x00,
    0x00,
    0x00,
    0x00,
    cadence >> 8,
    cadence & 0xff,
    0x00,
  ]);

/** A `D2` frame reporting resistance `level`. */
export const resistanceFrame = (level: number): number[] => withChecksum([0xf0, 0xd2, 0x01, level]);

/** The `B1` write that sets the target resistance to `level`, as the fake records it. */
export const targetResistanceWrite = (level: number): string =>
  withChecksum([0xf0, 0xb1, 0x01, level])
    .map((byte) => byte.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');

/** The writes of a connection's initialisation, after its subscription (L2-016). */
export const ECHELON_INITIALISED = [
  `subscribe ${ECHELON_NOTIFY}`,
  `write ${ECHELON_WRITE} F0 A1 00 91`,
  `write ${ECHELON_WRITE} F0 A3 00 93`,
  `write ${ECHELON_WRITE} F0 B0 01 01 A2`,
];

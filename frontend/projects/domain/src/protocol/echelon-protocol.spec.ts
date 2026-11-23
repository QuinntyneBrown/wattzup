// Unit test
// Traces to: L2-024 AC1, AC2; L2-025 AC1, AC2; L2-006; L2-007
// Description: the Echelon frames encode as docs/protocol/echelon-ble-frames.md documents them, and a set-resistance
// command parses back to its level.
import { EchelonProtocol, toHex } from './echelon-protocol';

describe('EchelonProtocol', () => {
  it.each([
    [12, 'F0 B1 01 0C AE'],
    [32, 'F0 B1 01 20 C2'],
  ])('encodes set resistance %i as %s', (level, bytes) => {
    expect(toHex(EchelonProtocol.setResistance(level))).toBe(bytes);
  });

  it.each([
    [0, 1],
    [-5, 1],
    [40, 32],
  ])('clamps a target of %i to %i before it is sent', (level, sent) => {
    expect(EchelonProtocol.parseSetResistance(EchelonProtocol.setResistance(level))).toBe(sent);
  });

  it('parses a set-resistance command back to its level', () => {
    expect(
      EchelonProtocol.parseSetResistance(Uint8Array.from([0xf0, 0xb1, 0x01, 0x0c, 0xae])),
    ).toBe(12);
  });

  it.each([
    ['a wrong checksum', [0xf0, 0xb1, 0x01, 0x0c, 0xaf]],
    ['another type', [0xf0, 0xd2, 0x01, 0x0c, 0xcf]],
    ['a short frame', [0xf0, 0xb1, 0x01]],
  ])('refuses %s', (_, bytes) => {
    expect(EchelonProtocol.parseSetResistance(Uint8Array.from(bytes))).toBeNull();
  });

  it('encodes the documented D1 example: 5 s, no revolutions, 80 rpm', () => {
    const frame = EchelonProtocol.workout({ elapsedSeconds: 5, revolutions: 0, cadence: 80 });

    expect(toHex(frame)).toBe('F0 D1 09 00 05 00 00 00 00 00 50 00 1F');
  });

  it('encodes the documented D2 example: resistance 12', () => {
    expect(toHex(EchelonProtocol.resistance(12))).toBe('F0 D2 01 0C CF');
  });
});

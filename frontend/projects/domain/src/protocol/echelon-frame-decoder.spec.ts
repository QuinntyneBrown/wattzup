// Unit test (the slice's acceptance table: no screen shows telemetry until slice 3.2)
// Traces to: L2-020 AC1 to AC4
// Description: an Echelon notification decodes to resistance (D2) or cadence (D1); a malformed, unknown or D0 frame
// is ignored without an error. One case per row of the requirement.
import { EchelonFrameDecoder } from './echelon-frame-decoder';

const AT = 1_700_000_000_000;
const bytes = (hex: string) => Uint8Array.from(hex.split(' '), (b) => parseInt(b, 16));

describe('EchelonFrameDecoder', () => {
  it('decodes F0 D2 01 0C CF as resistance 12 (AC1)', () => {
    expect(EchelonFrameDecoder.decode(bytes('F0 D2 01 0C CF'), AT)).toEqual({
      at: AT,
      resistance: 12,
    });
  });

  it('decodes F0 D1 09 00 05 00 00 00 00 00 50 00 1F as cadence 80 rpm (AC2)', () => {
    expect(EchelonFrameDecoder.decode(bytes('F0 D1 09 00 05 00 00 00 00 00 50 00 1F'), AT)).toEqual(
      {
        at: AT,
        cadence: 80,
      },
    );
  });

  it('reads cadence big-endian from bytes 9 and 10', () => {
    expect(
      EchelonFrameDecoder.decode(bytes('F0 D1 09 00 05 00 00 00 00 01 2C 00 FF'), AT)?.cadence,
    ).toBe(300);
  });

  it.each([
    ['shorter than 4 bytes', 'F0 D2 01'],
    ['empty', ''],
    ['byte 0 other than F0', 'F1 D2 01 0C D0'],
    ['of an unknown type', 'F0 D5 01 0C D2'],
    ['a D1 shorter than 13 bytes', 'F0 D1 09 00 05 00 00 00 00 00 50 00'],
    ['a D0 frame (AC4)', 'F0 D0 01 00 C1'],
  ])('ignores a frame %s, without an error (AC3)', (_, hex) => {
    const frame = hex ? bytes(hex) : new Uint8Array();

    expect(() => EchelonFrameDecoder.decode(frame, AT)).not.toThrow();
    expect(EchelonFrameDecoder.decode(frame, AT)).toBeNull();
  });
});

// Unit test
// Traces to: L2-014 AC2, AC4
// Description: the control point commands and responses, the resistance range, and the mapping of levels 1 to 32
// onto a bike's range, one case per row.
import { FtmsProtocol } from './ftms-protocol';

const view = (...bytes: number[]) => new DataView(Uint8Array.from(bytes).buffer);

describe('FtmsProtocol', () => {
  it('writes Request Control as op code 0x00', () => {
    expect([...FtmsProtocol.requestControl()]).toEqual([0x00]);
  });

  it('writes Set Target Resistance Level as op code 0x04 and a little-endian sint16', () => {
    expect([...FtmsProtocol.setTargetResistanceLevel(250)]).toEqual([0x04, 0xfa, 0x00]);
    expect([...FtmsProtocol.setTargetResistanceLevel(1000)]).toEqual([0x04, 0xe8, 0x03]);
  });

  it.each([
    [[0x80, 0x00, 0x01], { requestOpCode: 0x00, success: true }],
    [[0x80, 0x00, 0x05], { requestOpCode: 0x00, success: false }],
    [[0x80, 0x04, 0x01], { requestOpCode: 0x04, success: true }],
    [[0x00, 0x00, 0x01], null],
    [[0x80, 0x00], null],
  ])('decodes the control point bytes %j as %j', (bytes, response) => {
    expect(FtmsProtocol.decodeControlPointResponse(view(...bytes))).toEqual(response);
  });

  it('decodes the supported resistance level range', () => {
    expect(FtmsProtocol.decodeResistanceRange(view(0x0a, 0x00, 0xe8, 0x03, 0x0a, 0x00))).toEqual({
      minimum: 10,
      maximum: 1000,
      increment: 10,
    });
  });

  it.each([
    [1, { minimum: 10, maximum: 1000, increment: 10 }, 10],
    [32, { minimum: 10, maximum: 1000, increment: 10 }, 1000],
    [16, { minimum: 10, maximum: 1000, increment: 10 }, 490],
    [2, { minimum: 0, maximum: 100, increment: 1 }, 3],
    [2, { minimum: 0, maximum: 100, increment: 5 }, 5],
    [31, { minimum: 0, maximum: 100, increment: 7 }, 98],
    [32, { minimum: 0, maximum: 100, increment: 7 }, 98],
    [0, { minimum: 0, maximum: 100, increment: 1 }, 0],
    [40, { minimum: 0, maximum: 100, increment: 1 }, 100],
    [16, { minimum: -50, maximum: 50, increment: 0 }, -2],
  ])('maps level %i onto %j as %i', (level, range, raw) => {
    expect(FtmsProtocol.mapLevel(level, range)).toBe(raw);
  });
});

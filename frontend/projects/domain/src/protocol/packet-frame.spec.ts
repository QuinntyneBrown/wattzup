// Unit test
// Traces to: L2-114 AC3
// Description: each packet's frame type: an Echelon frame's command byte, an FTMS characteristic's name, or the UUID.
import { EchelonProtocol } from './echelon-protocol';
import { FtmsProtocol } from './ftms-protocol';
import { packetFrame } from './packet-frame';

describe('packetFrame', () => {
  it.each([
    ['a set-resistance write', EchelonProtocol.write, [0xf0, 0xb1, 0x01, 0x08, 0xaa], 'B1'],
    ['a keepalive', EchelonProtocol.write, [0xf0, 0xa0, 0x01, 0x01, 0x92], 'A0'],
    ['a workout notification', EchelonProtocol.notify, [0xf0, 0xd1, 0x09], 'D1'],
    ['a frame too short to name', EchelonProtocol.notify, [0xf0], '?'],
    ['FTMS bike data', FtmsProtocol.indoorBikeData, [0x44, 0x02], 'Indoor Bike Data'],
    ['an FTMS control point write', FtmsProtocol.controlPoint, [0x00], 'Control Point'],
    ['an unknown characteristic', 'abcd', [0x01], 'abcd'],
  ])('names %s', (_, characteristic, bytes, frame) => {
    expect(packetFrame(characteristic, new Uint8Array(bytes))).toBe(frame);
  });
});

import { EchelonProtocol } from './echelon-protocol';
import { FtmsProtocol } from './ftms-protocol';

const FTMS_NAMES: Record<string, string> = {
  [FtmsProtocol.indoorBikeData]: 'Indoor Bike Data',
  [FtmsProtocol.controlPoint]: 'Control Point',
  [FtmsProtocol.resistanceRange]: 'Resistance Range',
};

/**
 * A packet's frame type for the packet log (L2-114 AC3): an Echelon frame's command byte after the `F0` marker
 * ("B1", "D1"), or the FTMS characteristic's name; any other characteristic by its UUID.
 */
export function packetFrame(characteristic: string, bytes: Uint8Array): string {
  if (characteristic === EchelonProtocol.write || characteristic === EchelonProtocol.notify)
    return bytes.length > 1 ? bytes[1].toString(16).toUpperCase().padStart(2, '0') : '?';
  return FTMS_NAMES[characteristic] ?? characteristic;
}

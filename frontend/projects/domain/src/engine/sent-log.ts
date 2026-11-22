import type { BikeKind, SentCommand } from '@telo/api';
import { EchelonProtocol } from '../protocol/echelon-protocol';
import { FtmsProtocol } from '../protocol/ftms-protocol';

/** The most rows "Sent to bike" shows; older ones stay in the packet log only (L2-029 AC3). */
export const SENT_LOG_ROWS = 50;

/** The log with `row` at the top, the oldest dropped past 50 (L2-029 AC1, AC3). */
export function logSent(rows: readonly SentCommand[], row: SentCommand): readonly SentCommand[] {
  return [row, ...rows.slice(0, SENT_LOG_ROWS - 1)];
}

/** The link "Sent to bike" names: "BLE · " and the first part of the bike's service, "BLE · 0bf669f1" (L2-029 AC4). */
export function bleLinkName(kind: BikeKind): string {
  const service = kind === 'echelon' ? EchelonProtocol.service : FtmsProtocol.service;
  return `BLE · ${service.split('-')[0]}`;
}

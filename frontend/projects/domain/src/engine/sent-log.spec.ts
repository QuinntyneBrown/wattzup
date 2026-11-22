import type { SentCommand } from '@telo/api';
import { SENT_LOG_ROWS, bleLinkName, logSent } from './sent-log';

const row = (rideTime: number): SentCommand => ({ rideTime, level: 6, source: 'plan', ackMs: 34 });

describe('logSent', () => {
  it('puts the newest row at the top (L2-029 AC1)', () => {
    expect(logSent([row(300)], row(330)).map((r) => r.rideTime)).toEqual([330, 300]);
  });

  it('keeps the newest 50 rows (L2-029 AC3)', () => {
    let rows: readonly SentCommand[] = [];
    for (let t = 0; t < 60; t++) rows = logSent(rows, row(t));
    expect(rows).toHaveLength(SENT_LOG_ROWS);
    expect(rows[0]!.rideTime).toBe(59);
    expect(rows[49]!.rideTime).toBe(10);
  });
});

describe('bleLinkName', () => {
  it('names the link by the first part of the bike’s service (L2-029 AC4)', () => {
    expect(bleLinkName('echelon')).toBe('BLE · 0bf669f1');
    expect(bleLinkName('ftms')).toBe('BLE · 00001826');
  });
});

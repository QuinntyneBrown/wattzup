// Unit test
// Traces to: L2-114 AC1, AC2, AC3
// Description: the packet log's count line, commands while only commands are kept and packets once the bike's
// messages are among them, its size, the Recording tag, and the file's name by the device's date.
import { packetLogFileName, packetLogSummary, sizeLabel } from './packet-log-summary';

describe('packetLogSummary', () => {
  it.each([
    [212, 20 * 1024, false, false, { figure: '212', unit: ' commands · 20 KB', recording: false }],
    [1284, 186 * 1024, true, true, { figure: '1,284', unit: ' packets · 186 KB', recording: true }],
    [1, 80, false, false, { figure: '1', unit: ' command · 1 KB', recording: false }],
    [0, 0, false, true, { figure: '0', unit: ' packets · 0 KB', recording: true }],
    [40, 4096, true, false, { figure: '40', unit: ' packets · 4 KB', recording: false }],
  ])(
    '%i entries of %i bytes (incoming %s, recording %s)',
    (count, bytes, incoming, recording, summary) => {
      expect(packetLogSummary(count, bytes, incoming, recording)).toEqual(summary);
    },
  );

  it.each([
    [0, '0 KB'],
    [1, '1 KB'],
    [1024, '1 KB'],
    [1025, '2 KB'],
    [1024 * 1024, '1.0 MB'],
    [10 * 1024 * 1024, '10.0 MB'],
  ])('%i bytes read "%s"', (bytes, label) => {
    expect(sizeLabel(bytes)).toBe(label);
  });

  it('names the file by the day', () => {
    expect(packetLogFileName(new Date(2026, 0, 5, 23, 59))).toBe(
      'telo-ride-packets-2026-01-05.jsonl',
    );
  });
});

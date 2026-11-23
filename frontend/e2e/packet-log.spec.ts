import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { startCustomRide } from './fixtures/custom-ride';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { DiagnosticsDialog } from './pages/diagnostics.dialog';

// Slice 25.2, Record the packet log (L2-114, L2-115): what went to the bike, or every message both ways while "Log
// every packet" is on, kept on the device and saved as a file.
//
// Given a ride on a connected bike with "Log every packet" off, when Diagnostics opens, then the log counts the
//   commands sent, "N commands · N KB", and the console holds no per-packet line (L2-114 AC1, L2-115 AC2).
// Given that log, when "Download packet log" is pressed, then telo-ride-packets-{YYYY-MM-DD}.jsonl is saved with one
//   JSON object per command, in order (time, direction, frame type, hex bytes), and the dialog says what it saves
//   (AC3).
// Given "Log every packet" on, when the bike's messages arrive, then they are kept too: the count reads "N packets ·
//   N KB" with a "Recording" tag, and the file holds both directions (AC2, AC3).
//
// The clock runs as it does for a rider, so the bike's keepalive goes on once a second: the counts are compared with
// the writes before and after, and the file with the writes in order.

type Line = { time: string; direction: 'out' | 'in'; frame: string; hex: string };

const hex = (bytes: readonly number[]): string =>
  bytes.map((byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ');

/** The packet lines the page writes to its console. */
function packetLines(page: Page): string[] {
  const lines: string[] = [];
  page.on('console', (message) => {
    if (message.text().startsWith('[bluetooth] packet')) lines.push(message.text());
  });
  return lines;
}

/** Opens Diagnostics from the ride's bike status, with time running: the dialog's code loads on demand. */
async function openDiagnostics(page: Page, open: () => Promise<void>): Promise<DiagnosticsDialog> {
  await page.clock.resume();
  await open();
  const diagnostics = new DiagnosticsDialog(page);
  await expect(diagnostics.heading).toBeVisible();
  return diagnostics;
}

/** The figure of the count line, once it reads "N {noun} · N KB". */
async function counted(diagnostics: DiagnosticsDialog, noun: string): Promise<number> {
  const pattern = new RegExp(`^([\\d,]+) ${noun} · \\d+ KB`);
  await expect(diagnostics.count).toHaveText(pattern);
  const text = (await diagnostics.count.textContent()) ?? '';
  return Number(pattern.exec(text)?.[1].replace(/,/g, ''));
}

async function saved(
  diagnostics: DiagnosticsDialog,
  page: Page,
): Promise<{ name: string; lines: Line[] }> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    diagnostics.download.click(),
  ]);
  const text = await readFile(await download.path(), 'utf8');
  return {
    name: download.suggestedFilename(),
    lines: text
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Line),
  };
}

test('with "Log every packet" off, the log keeps the commands and saves them as JSON Lines (L2-114 AC1, AC3; L2-115 AC2) @critical', async ({
  page,
  bluetooth,
}) => {
  const console = packetLines(page);
  const ride = await startCustomRide(page, bluetooth);
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
  const before = bluetooth.writes().length;
  const diagnostics = await openDiagnostics(page, () => ride.diagnostics.click());

  await expect(diagnostics.everyPacket).toHaveAttribute('aria-checked', 'false');
  const shown = await counted(diagnostics, 'commands');
  expect(shown).toBeGreaterThanOrEqual(before);
  // The log keeps a command as it goes out, a moment before the fake reports the write.
  await expect.poll(() => bluetooth.writes().length).toBeGreaterThanOrEqual(shown);
  await expect(diagnostics.recording).toHaveCount(0);
  const today = await page.evaluate(() => {
    const now = new Date();
    return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      .map((part) => String(part).padStart(2, '0'))
      .join('-');
  });
  await expect(diagnostics.file).toHaveText(
    `Saves telo-ride-packets-${today}.jsonl. Attach it to a bug report if we ask.`,
  );

  const file = await saved(diagnostics, page);
  expect(file.name).toBe(`telo-ride-packets-${today}.jsonl`);
  // Every command, in order, and nothing from the bike.
  await expect.poll(() => bluetooth.writes().length).toBeGreaterThanOrEqual(file.lines.length);
  const sent = bluetooth.writes().map((write) => write.hex);
  expect(file.lines.length).toBeGreaterThanOrEqual(shown);
  expect(file.lines.map((line) => line.hex)).toEqual(sent.slice(0, file.lines.length));
  expect(new Set(file.lines.map((line) => line.direction))).toEqual(new Set(['out']));
  expect(file.lines.map((line) => line.frame)).toEqual(
    file.lines.map((line) => line.hex.split(' ')[1]),
  );
  for (const line of file.lines) expect(new Date(line.time).toISOString()).toBe(line.time);
  expect(console).toEqual([]);
});

test('with "Log every packet" on, every message both ways is kept and counted as Recording (L2-114 AC2, AC3)', async ({
  page,
  bluetooth,
}) => {
  const console = packetLines(page);
  const ride = await startCustomRide(page, bluetooth);
  const diagnostics = await openDiagnostics(page, () => ride.diagnostics.click());

  await diagnostics.everyPacket.click();
  await expect(diagnostics.everyPacket).toHaveAttribute('aria-checked', 'true');
  const before = bluetooth.writes().length;
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(8));

  expect(await counted(diagnostics, 'packets')).toBeGreaterThanOrEqual(before + 2);
  await expect(diagnostics.recording).toHaveText('Recording');
  const file = await saved(diagnostics, page);
  expect(file.lines.filter((line) => line.direction === 'in')).toEqual([
    expect.objectContaining({ direction: 'in', frame: 'D1', hex: hex(workoutFrame(80)) }),
    expect.objectContaining({ direction: 'in', frame: 'D2', hex: hex(resistanceFrame(8)) }),
  ]);
  // The keepalives go to the console too while it records; the bike's two messages are the only ones in.
  expect(console.filter((line) => line.includes(' packet in '))).toEqual([
    `[bluetooth] packet in D1 ${hex(workoutFrame(80))}`,
    `[bluetooth] packet in D2 ${hex(resistanceFrame(8))}`,
  ]);
});

// Acceptance test
// Traces to: L2-123 AC1, AC3; L2-060 AC1, AC2, AC3
// Description: in a riders-online race the board is the service's. Each second the race reports the distance the rider
// has ridden and their power to the session, never more than twice a second. Every standings message the service sends
// replaces the board on the race's next second: every rider by the service's position, the rider's row current, each
// gap the rider's gap to the leader less the row's, and the place and the gaps ahead and behind beside the power.
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { openRace, peersBoard, raceStandings } from './fixtures/live-race';
import { RACE_SESSION } from './fixtures/race-lobby';
import { expect, test } from './fixtures/test';

const peersNames = [
  'Pacer Rook',
  'Pacer Juno',
  'Pacer Nova',
  'Pacer Atlas',
  'You',
  'Ollie R.',
  'priya_spins',
  'MarcoVelo',
  'jwatts',
  'lena.k',
];

test(
  'the board ranks the session as the service sends it, each gap to the rider (L2-123 AC3, L2-060 AC1, AC2)',
  { tag: '@critical' },
  async ({ page, hub, bluetooth }) => {
    const race = await openRace(page, hub, bluetooth, 4_500);
    await expect(race.boardTitle).toHaveText('Standings · 10 riders');

    await hub.send('RaceStandingsUpdated', raceStandings(peersBoard));
    await page.clock.runFor(1_000);

    await expect(race.boardNames).toHaveText(peersNames);
    await expect(race.boardGaps).toHaveText([
      '+0:07',
      '+0:06',
      '+0:03',
      '+0:02',
      '',
      '−0:01',
      '−0:04',
      '−0:05',
      '−0:05',
      '−0:05',
    ]);
    await expect(race.you).toHaveText(/^5You$/);
    await expect(race.place).toHaveText('5th');
    await expect(race.gaps).toHaveText(['Ahead +0:02', 'Behind −0:01']);

    const passed = peersBoard.map((line) =>
      line.seat === 6 ? { ...line, metres: 2_112, gapSeconds: 4.5 } : line,
    );
    await hub.send(
      'RaceStandingsUpdated',
      raceStandings([
        passed[0]!,
        passed[1]!,
        passed[2]!,
        passed[4]!,
        passed[3]!,
        ...passed.slice(5),
      ]),
    );
    await page.clock.runFor(1_000);

    await expect(race.you).toHaveText(/^4You$/);
    await expect(race.place).toHaveText('4th');
    await expect(race.boardGaps.nth(4)).toHaveText('−0:01');
  },
);

test('the race reports its distance and power each second, never more than twice a second (L2-123 AC1)', async ({
  page,
  hub,
  bluetooth,
}) => {
  await openRace(page, hub, bluetooth, 4_500);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(8));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
  const before = hub.invocations('ReportRaceProgress').length;

  for (let second = 0; second < 4; second++) await page.clock.runFor(1_000);

  const reports = hub.invocations('ReportRaceProgress').slice(before) as [string, number, number][];
  expect(reports.length).toBeGreaterThanOrEqual(3);
  expect(reports.length).toBeLessThanOrEqual(8);
  expect(reports.every(([id]) => id === RACE_SESSION)).toBe(true);
  const metres = reports.map(([, distance]) => distance);
  expect(metres.at(-1)!).toBeGreaterThan(metres[0]!);
  expect(reports.at(-1)![2]).toBeGreaterThan(0);
});

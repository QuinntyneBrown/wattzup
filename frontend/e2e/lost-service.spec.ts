// Acceptance test
// Traces to: L2-126 AC1, AC2
// Description: when the hub connection drops in the middle of a riders-online race or a group class and the service
// cannot be reached, the ride carries on with the bike and its clock, the board keeps its last standings, and a status
// notice under the board's title reads "Reconnecting. The standings will catch up." When the service is back, the ride
// reconnects and rejoins its session, the notice goes, and the standings the service sends update the board.
import type { Page } from '@playwright/test';
import {
  boardAtSeven,
  hiitCardio,
  hiitSession,
  seated,
  SESSIONS_NOW,
  standings,
} from './fixtures/classes';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame } from './fixtures/echelon';
import { openRace, peersBoard, raceStandings } from './fixtures/live-race';
import { expect, test } from './fixtures/test';
import { ClassRidePage } from './pages/class-ride.page';

const NOTICE = 'Reconnecting. The standings will catch up.';

test('a riders-online race carries on through a lost service, then rejoins and updates the board (L2-126 AC1, AC2) @critical', async ({
  page,
  hub,
  bluetooth,
}) => {
  const race = await openRace(page, hub, bluetooth, 4_500);
  await hub.send('RaceStandingsUpdated', raceStandings(peersBoard));
  await page.clock.runFor(1_000);
  await expect(race.place).toHaveText('5th');
  await expect(race.boardNotice).toBeEmpty();
  const before = await race.clock.textContent();

  await hub.lose();
  await page.clock.runFor(3_000);

  await expect(race.boardNotice).toHaveText(NOTICE);
  await expect(race.boardNotice).toHaveAttribute('role', 'status');
  await expect(race.clock).not.toHaveText(before ?? '');
  await expect(race.lost).toHaveCount(0);
  await expect(race.place).toHaveText('5th');

  hub.restore();
  await page.clock.runFor(10_000);

  await expect.poll(() => hub.invocations('JoinRace').length).toBe(2);
  // The paused clock runs a frame so the zoneless page draws the rejoin.
  await page.clock.runFor(100);
  await expect(race.boardNotice).toBeEmpty();
  const passed = peersBoard.map((line) =>
    line.seat === 6 ? { ...line, metres: 2_112, gapSeconds: 4.5 } : line,
  );
  await hub.send(
    'RaceStandingsUpdated',
    raceStandings([passed[0]!, passed[1]!, passed[2]!, passed[4]!, passed[3]!, ...passed.slice(5)]),
  );
  await page.clock.runFor(1_000);
  await expect(race.place).toHaveText('4th');
});

test.describe('A group class through a lost service', () => {
  const session = hiitSession('2026-11-21T19:29:00Z', []);

  async function openRiding(page: Page, ride: ClassRidePage): Promise<void> {
    await ride.openGroup(hiitCardio.id, session.id);
    await expect(ride.clock).not.toHaveText(/^0:00/);
    await page.clock.pauseAt(SESSIONS_NOW - 500);
    await page.clock.runFor(1_000);
  }

  test.beforeEach(async ({ page, bluetooth, hub, webgl }) => {
    await page.clock.install({ time: SESSIONS_NOW - 10_000 });
    await webgl.disable();
    await bluetooth.remember(echelonBike);
    hub.open();
    hub.answer('ServerTime', () => page.evaluate(() => Date.now()));
    hub.answer('JoinClassSession', () => seated(session));
  });

  test('the class rides on with its last standings and the notice, then rejoins and the board updates (L2-126 AC1, AC2)', async ({
    page,
    hub,
    bluetooth,
  }) => {
    const ride = new ClassRidePage(page);
    await openRiding(page, ride);
    // The bike reports its resistance, so its link is up through the lost service.
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
    await hub.send('StandingsUpdated', standings(session, boardAtSeven));
    await page.clock.runFor(100);
    await expect(ride.boardPlace).toHaveText('5th / 9');
    await expect(ride.boardNotice).toBeEmpty();
    const before = await ride.clock.textContent();

    await hub.lose();
    await page.clock.runFor(3_000);

    await expect(ride.boardNotice).toHaveText(NOTICE);
    await expect(ride.boardNotice).toHaveAttribute('role', 'status');
    await expect(ride.clock).not.toHaveText(before ?? '');
    await expect(ride.lost).toHaveCount(0);
    await expect(ride.boardPlace).toHaveText('5th / 9');

    hub.restore();
    await page.clock.runFor(10_000);

    await expect.poll(() => hub.invocations('JoinClassSession').length).toBe(2);
    await page.clock.runFor(100);
    await expect(ride.boardNotice).toBeEmpty();
    const later = boardAtSeven.map(([name, jersey, kj]) =>
      name === 'lena.k' ? ([name, jersey, 69.0] as const) : ([name, jersey, kj] as const),
    );
    await hub.send('StandingsUpdated', standings(session, later));
    await page.clock.runFor(100);
    await expect(ride.boardPlace).toHaveText('2nd / 9');
  });
});

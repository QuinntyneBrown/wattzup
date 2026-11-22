// Acceptance test
// Traces to: L2-090 AC1, AC2, AC4; L2-123 AC1, AC3; L2-087 AC1
// Description: a group class ride shows the output board the hub sends once a second: "Output" with the rider's place
// ("5th / 9"), every rider by output in kJ, highest first, and the rider's own row as "You" with aria-current="true";
// the header counts the riders. Each new standings reorders the board. The ride reports its output in kJ and its power
// to the hub every second, never more than twice a second. A solo ride has no board.
import type { Page } from '@playwright/test';
import {
  boardAtSeven,
  hiitCardio,
  hiitSession,
  seated,
  SESSIONS_NOW,
  standings,
} from './fixtures/classes';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from './fixtures/echelon';
import type { HubFixture } from './fixtures/hub';
import { connectBike } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';
import { ClassRidePage } from './pages/class-ride.page';
import { WorldLoadingPage } from './pages/world-loading.page';

/** A session that started a minute before SESSIONS_NOW, so the ride rides at once. */
const session = hiitSession('2026-11-21T19:29:00Z', []);

/**
 * Opens the group ride in the session and, once it rides, stands the clock half a second past SESSIONS_NOW (L154). It
 * waits for the seat first, then for the class ride, so a slow step says which it was: World loading joins the session
 * and measures the clock offset before the class ride takes its place.
 */
async function openRiding(page: Page, ride: ClassRidePage, hub: HubFixture): Promise<void> {
  await ride.openGroup(hiitCardio.id, session.id);
  await expect.poll(() => hub.invocations('JoinClassSession').length).toBe(1);
  await expect(ride.clock).not.toHaveText(/^0:00/);
  await page.clock.pauseAt(SESSIONS_NOW - 500);
  await page.clock.runFor(1_000);
}

/** The hub sends the standings; the paused clock runs a frame so the page draws them (zoneless rendering waits on it). */
async function arrive(
  page: Page,
  hub: HubFixture,
  sent: ReturnType<typeof standings>,
): Promise<void> {
  await hub.send('StandingsUpdated', sent);
  await page.clock.runFor(100);
}

test.describe('The group output board', () => {
  test.beforeEach(async ({ page, bluetooth, hub, webgl }) => {
    await page.clock.install({ time: SESSIONS_NOW - 10_000 });
    // The class rides its panorama: these specs ride the board, not the world, whose build would run on every frame.
    await webgl.disable();
    await bluetooth.remember(echelonBike);
    hub.open();
    hub.answer('ServerTime', () => page.evaluate(() => Date.now()));
    hub.answer('JoinClassSession', () => seated(session));
  });

  test('the board ranks every rider by output with the rider’s place and own row (L2-090 AC1) @critical', async ({
    page,
    hub,
  }) => {
    const ride = new ClassRidePage(page);
    await openRiding(page, ride, hub);

    await arrive(page, hub, standings(session, boardAtSeven));

    await expect(ride.boardTitle).toHaveText('Output');
    await expect(ride.boardPlace).toHaveText('5th / 9');
    expect(await ride.boardLines()).toEqual([
      '1 kenji.cyc 73',
      '2 Pacer Nova 68',
      '3 Ollie R. 67',
      '4 ana_rides 67',
      '5 You 65',
      '6 jwatts 63',
      '7 priya_spins 62',
      '8 MarcoVelo 50',
      '9 Pacer Rook 50',
    ]);
    await expect(ride.boardYou).toContainText('You');
    await expect(ride.name).toHaveText('30 Minute HIIT Cardio · Group · 9 riders');
  });

  test('each new standings reorders the board (L2-090 AC2)', async ({ page, hub }) => {
    const ride = new ClassRidePage(page);
    await openRiding(page, ride, hub);
    await arrive(page, hub, standings(session, boardAtSeven));
    await expect(ride.boardPlace).toHaveText('5th / 9');

    const later = boardAtSeven.map(([name, jersey, kj]) =>
      name === 'lena.k' ? ([name, jersey, 69.0] as const) : ([name, jersey, kj] as const),
    );
    await arrive(page, hub, standings(session, later));

    await expect(ride.boardPlace).toHaveText('2nd / 9');
    await expect.poll(() => ride.boardLines()).toContain('2 You 69');
  });

  test('the ride reports its output and power every second, never more than twice a second (L2-123 AC1)', async ({
    page,
    hub,
    bluetooth,
  }) => {
    const ride = new ClassRidePage(page);
    await openRiding(page, ride, hub);
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(8));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
    const before = hub.invocations('ReportProgress').length;

    for (let second = 0; second < 4; second++) await page.clock.runFor(1_000);

    const reports = hub.invocations('ReportProgress').slice(before) as [string, number, number][];
    expect(reports.length).toBeGreaterThanOrEqual(3);
    expect(reports.length).toBeLessThanOrEqual(8);
    expect(reports.every(([id]) => id === session.id)).toBe(true);
    const outputs = reports.map(([, kj]) => kj);
    expect(outputs.at(-1)!).toBeGreaterThan(outputs[0]!);
    expect(reports.at(-1)![2]).toBeGreaterThan(0);
  });

  test('a solo class ride has no board (L2-090 AC4)', async ({ page, bluetooth }) => {
    const ride = new ClassRidePage(page);
    await ride.open(hiitCardio.id);
    await connectBike(bluetooth);
    await new WorldLoadingPage(page).startRiding();
    await expect(ride.clock).toBeVisible();

    await expect(ride.board).toHaveCount(0);
  });
});

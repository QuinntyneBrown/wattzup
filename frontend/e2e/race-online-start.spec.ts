// Acceptance test
// Traces to: L2-121 AC3; L2-056 AC3, AC4; L2-120 AC1
// Description: at Go the lobby opens the race in the rider's session. The race joins the session again on its own
// connection and hears the start as server time; its clock runs from that start, corrected by the measured offset, so
// every rider's race clock in the session reads the same at the same moment, however late the page opened. A race that
// opens a moment before the start holds at 0:00 until it.
import type { Page } from '@playwright/test';
import { echelonBike } from './fixtures/echelon';
import type { HubFixture } from './fixtures/hub';
import { RACE_SESSION, bot, found, lobbyOfSix } from './fixtures/race-lobby';
import { expect, test } from './fixtures/test';
import { FakeWebGl } from './fixtures/webgl';
import { RacePage } from './pages/race.page';

const NOW = new Date('2026-11-22T18:00:30Z').getTime();
/** Where each spec stands: far enough ahead that the page opens and joins first. */
const PAUSED_AT = NOW + 15_000;

/** The session's grid at the start: the mock's riders and the rider, the open seats filled by bots. */
const atTheStart = lobbyOfSix.map((seat, i) =>
  seat.kind === 'open' ? bot(seat.number, ['Nova', 'Rook', 'Juno', 'Atlas'][i - 6]) : seat,
);

/**
 * Opens the race in the rider's session, then pauses the clock at a fixed moment on the page's installed clock,
 * `fromStart` ms after the session's start (a negative value: still to come), whose start the hub answers. The clock
 * stands half a second into the second it shows (L154), however long the page took to open (L165).
 */
async function openRace(
  page: Page,
  hub: HubFixture,
  bluetooth: { remember: (bike: typeof echelonBike) => Promise<void> },
  fromStart: number,
): Promise<RacePage> {
  await new FakeWebGl(page).disable();
  hub.open();
  hub.answer('ServerTime', () => page.evaluate(() => Date.now()));
  hub.answer('JoinRace', () => found(PAUSED_AT - fromStart, 6, atTheStart));
  await page.clock.install({ time: NOW });
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open('old-town-criterium', `mode=online&session=${RACE_SESSION}`);
  await expect.poll(() => hub.invocations('JoinRace').length).toBe(1);
  await expect(race.route).toHaveText('Cathedral Circuit · Live race');
  await page.clock.pauseAt(PAUSED_AT);
  await page.clock.runFor(100);
  return race;
}

test(
  'the race joins its session and its clock runs from the session’s server-time start, however late it opened (L2-121 AC3, L2-056 AC4)',
  { tag: '@critical' },
  async ({ page, hub, bluetooth }) => {
    const race = await openRace(page, hub, bluetooth, 4_500);

    expect(hub.invocations('JoinRace')).toEqual([[RACE_SESSION]]);
    await expect(race.clock).toHaveText(/^0:04/);
    await page.clock.runFor(1_000);
    await expect(race.clock).toHaveText(/^0:05/);
  },
);

test('a race that opens a moment before the start holds at 0:00 until it, then runs (L2-056 AC3)', async ({
  page,
  hub,
  bluetooth,
}) => {
  const race = await openRace(page, hub, bluetooth, -1_500);

  await expect(race.clock).toHaveText(/^0:00/);
  await page.clock.runFor(1_000);
  await expect(race.clock).toHaveText(/^0:00/);
  await page.clock.runFor(2_000);
  await expect(race.clock).toHaveText(/^0:01/);
});

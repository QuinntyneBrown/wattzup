// Acceptance test
// Traces to: L2-121 AC3; L2-056 AC3, AC4; L2-120 AC1
// Description: at Go the lobby opens the race in the rider's session. The race joins the session again on its own
// connection and hears the start as server time; its clock runs from that start, corrected by the measured offset, so
// every rider's race clock in the session reads the same at the same moment, however late the page opened. A race that
// opens a moment before the start holds at 0:00 until it.
import { openRace } from './fixtures/live-race';
import { RACE_SESSION } from './fixtures/race-lobby';
import { expect, test } from './fixtures/test';

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

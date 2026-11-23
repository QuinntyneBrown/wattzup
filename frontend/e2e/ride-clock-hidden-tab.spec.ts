// Acceptance test
// Traces to: L2-133 AC1, AC2, AC4
// Description: a ride's clock comes from the monotonic clock, so a tab hidden for 10 minutes, its timers throttled to
// once a minute as Chrome's are while the bike's notifications still arrive each second, is where a visible tab would
// be the moment it is shown again: the clock, the plan's segment and, in a race, the distance within a second. A
// running race, like a running class, asks the rider to confirm before the tab closes.
import type { Page } from '@playwright/test';
import { startClassRide } from './fixtures/class-ride';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { startRace } from './fixtures/race';
import { hideTab, showTab } from './fixtures/tab';
import { expect, test } from './fixtures/test';

/** Rides at 85 rpm for `seconds`, a notification from the bike each second. */
async function ride(page: Page, bluetooth: FakeBluetooth, seconds: number): Promise<void> {
  for (let second = 0; second < seconds; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
    await page.clock.runFor(1000);
  }
}

test('a race hidden for 10 minutes with its timers throttled shows the clock, the segment and the distance a visible tab would (L2-133 AC1, AC2) @critical', async ({
  page,
  bluetooth,
  api,
}) => {
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo');
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(16));
  await ride(page, bluetooth, 10);
  await expect(race.clock).toHaveText(/^0:10 /);
  await expect(race.distance).toHaveText('0.13 km');

  await hideTab(page, { throttled: true });
  await ride(page, bluetooth, 600);
  await showTab(page);
  await page.clock.runFor(16);

  await expect(race.clock).toHaveText(/^10:10 /);
  await expect(race.intervalLabel).toHaveText('Recover');
  await expect(race.intervalLeft).toHaveText('1:20');
  // The same ride in a visible tab reads 7.95 km at 10:10.
  await expect(race.distance).toHaveText('7.95 km');
});

test('a class ride hidden for 10 minutes with its timers throttled shows the clock and the segment a visible tab would (L2-133 AC2)', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride10 = await startClassRide(page, bluetooth, api);
  await ride(page, bluetooth, 10);
  await expect(ride10.clock).toHaveText('0:10 / 30:00');

  await hideTab(page, { throttled: true });
  await ride(page, bluetooth, 600);
  await showTab(page);
  await page.clock.runFor(16);

  await expect(ride10.clock).toHaveText('10:10 / 30:00');
  await expect(ride10.segmentKind).toHaveText('Recover');
  await expect(ride10.segmentLeft).toHaveText('1:20');
});

test('closing or reloading the tab mid-race asks the rider to confirm (L2-133 AC4)', async ({
  page,
  bluetooth,
  api,
}) => {
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo');
  // The browser asks only on a page the rider has interacted with.
  await race.clock.click();
  const asked = page.waitForEvent('dialog');
  await page.close({ runBeforeUnload: true });
  const dialog = await asked;
  expect(dialog.type()).toBe('beforeunload');
  await dialog.accept();
});

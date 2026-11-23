// Acceptance test
// Traces to: L2-070 AC1 to AC5
// Description: when the bike stops answering in a bots race, an alert says so with Reconnect, the rider coasts with
// their speed decaying over 15 seconds and the resistance buttons off; a bike back within 15 seconds closes the alert
// and the race carries on, and 15 seconds without it end the race as a DNF with a way to Race Setup. A solo race parks
// until the bike is back.
import type { Page } from '@playwright/test';
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  resistanceFrame,
  workoutFrame,
} from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';
import type { RacePage } from './pages/race.page';
import { RaceSetupPage } from './pages/race-setup.page';

/** Rides 661 W (120 rpm on level 32, 64.2 km/h) for a minute, a frame every 4 s. */
async function rideAMinute(page: Page, bluetooth: FakeBluetooth) {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(32));
  for (let second = 0; second < 60; second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(120));
    await page.clock.runFor(4000);
  }
}

/** The bike goes silent and drops its link; the race notices within a second. */
async function loseTheBike(page: Page, bluetooth: FakeBluetooth) {
  await bluetooth.switchOff();
  await bluetooth.drop();
  await page.clock.runFor(1000);
}

/** Reconnect tries the bike at once; initialising waits between commands, so the clock steps until it is done. */
async function bringTheBikeBack(page: Page, bluetooth: FakeBluetooth, race: RacePage) {
  await bluetooth.switchOn();
  const before = bluetooth.log().length;
  await race.reconnect.click();
  await expect(async () => {
    await page.clock.runFor(100);
    expect(bluetooth.log().slice(before)).toEqual(ECHELON_INITIALISED);
  }).toPass();
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(32));
  await page.clock.runFor(1000);
}

const speed = async (race: RacePage) =>
  Number(await race.stats.nth(2).locator('.numeral').first().textContent());

test('in a bots race the rider coasts while the bike is lost, and carries on when it is back within 15 s (L2-070 AC1, AC2, AC3)', async ({
  page,
  bluetooth,
  api,
}) => {
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium');
  await rideAMinute(page, bluetooth);

  await loseTheBike(page, bluetooth);
  await expect(race.lost).toContainText('Lost the bike');
  await expect(race.lost).toContainText(
    'Echelon EX-5s stopped answering. Your rider coasts for 15 seconds while we reconnect; after that the race counts as a DNF.',
  );
  await expect(race.reconnect).toBeVisible();
  await expect(race.raise).toBeDisabled();
  await expect(race.lower).toBeDisabled();

  // The speed decays from 64.2 km/h towards standstill, and the race clock runs on.
  const early = await speed(race);
  await page.clock.runFor(4000);
  const later = await speed(race);
  expect(later).toBeLessThan(early);
  expect(later).toBeGreaterThan(0);
  await expect(race.clock).toHaveText('1:05 / 30:00');

  await bringTheBikeBack(page, bluetooth, race);
  await expect(race.lost).toHaveCount(0);
  await expect(race.raise).toBeEnabled();
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(120));
  await page.clock.runFor(2000);
  await expect(race.clock).not.toHaveText('1:05 / 30:00');
  await expect(race.stats.nth(2)).toContainText('64.2');
});

test(
  '15 seconds without the bike end a bots race as a DNF, with a way to Race Setup (L2-070 AC4)',
  { tag: '@critical' },
  async ({ page, bluetooth, api }) => {
    const race = await startRace(
      page,
      bluetooth,
      api,
      'old-town-criterium',
      'mode=bots&pack=medium',
    );
    await rideAMinute(page, bluetooth);

    await loseTheBike(page, bluetooth);
    await page.clock.runFor(15_000);
    await expect(race.lost).toContainText('Did not finish');
    await expect(race.lost).toContainText(
      'Echelon EX-5s didn’t come back within 15 seconds, so this race counts as a DNF and earns no XP.',
    );
    await expect(race.reconnect).toHaveCount(0);
    // The race is over: its clock stands still.
    const ended = await race.clock.textContent();
    await page.clock.runFor(10_000);
    await expect(race.clock).toHaveText(ended!);

    await race.backToSetup.click();
    await expect(page).toHaveURL('/race/old-town-criterium');
    const setup = new RaceSetupPage(page);
    await expect(async () => {
      await page.clock.runFor(16);
      await expect(setup.title).toHaveText('Old Town Criterium', { timeout: 50 });
    }).toPass();
  },
);

test('a solo race parks while the bike is lost, and carries on when it is back (L2-070 AC5)', async ({
  page,
  bluetooth,
  api,
}) => {
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo');
  await rideAMinute(page, bluetooth);

  await loseTheBike(page, bluetooth);
  await expect(race.lost).toContainText('Lost the bike');
  await expect(race.lost).toContainText(
    'Echelon EX-5s stopped answering. Your ride is parked until the bike is back, then carries on from where it stopped.',
  );
  await expect(race.pause).toBeDisabled();
  await expect(race.raise).toBeDisabled();
  const held = await race.clock.textContent();
  const distance = await race.distance.textContent();
  // Parked: no coast and no DNF, however long the bike is away.
  await page.clock.runFor(30_000);
  await expect(race.clock).toHaveText(held!);
  await expect(race.distance).toHaveText(distance!);
  await expect(race.lost).toContainText('Lost the bike');

  await bringTheBikeBack(page, bluetooth, race);
  await expect(race.lost).toHaveCount(0);
  await expect(race.pause).toBeEnabled();
  await page.clock.runFor(3000);
  await expect(race.clock).not.toHaveText(held!);
});

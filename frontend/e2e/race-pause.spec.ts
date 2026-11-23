// Acceptance test
// Traces to: L2-068 AC1, AC2
// Description: a solo race pauses: the clock, the distance and the standings hold still, Pause becomes Resume, and a
// status overlay says so without blocking the buttons. Resume, or pedalling again once the rider has stopped, carries
// the race on from where it stopped.
import type { Page } from '@playwright/test';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';

/** Pedals at `rpm` for `seconds`, a frame every 4 s inside cadence's 5-second timeout. */
async function pedal(page: Page, bluetooth: FakeBluetooth, rpm: number, seconds: number) {
  for (let second = 0; second < seconds; second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(rpm));
    await page.clock.runFor(4000);
  }
}

test('Pause holds a solo race still under a status overlay, and Resume carries it on (L2-068 AC1, AC2)', async ({
  page,
  bluetooth,
  api,
}) => {
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo');
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(10));
  await pedal(page, bluetooth, 90, 60);
  await expect(race.clock).toHaveText('1:00 / 30:00');

  await race.pause.click();
  await page.clock.runFor(100);
  await expect(race.resume).toBeVisible();
  await expect(race.pause).toHaveCount(0);
  await expect(race.paused).toHaveRole('status');
  await expect(race.paused).toContainText('Paused on Cathedral Circuit');
  await expect(race.paused).toContainText('The world holds still until you pedal again.');
  const distance = await race.distance.textContent();
  const gaps = await race.gaps.allTextContents();

  await page.clock.runFor(20_000);
  await expect(race.clock).toHaveText('1:00 / 30:00');
  await expect(race.distance).toHaveText(distance!);
  await expect(race.gaps).toHaveText(gaps);
  // The overlay lets presses through to the controls under it.
  await race.raise.click();

  await race.resume.click();
  await pedal(page, bluetooth, 90, 8);
  await expect(race.paused).toHaveCount(0);
  await expect(race.pause).toBeVisible();
  await expect(race.clock).toHaveText('1:08 / 30:00');
  await expect(race.distance).not.toHaveText(distance!);
});

test('pedalling again after stopping carries a paused solo race on (L2-068 AC2)', async ({
  page,
  bluetooth,
  api,
}) => {
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo');
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(10));
  await pedal(page, bluetooth, 90, 20);
  await race.pause.click();

  // Still pedalling from before the press: the race stays paused.
  await pedal(page, bluetooth, 90, 8);
  await expect(race.resume).toBeVisible();
  await expect(race.clock).toHaveText('0:20 / 30:00');

  // Stopped, then pedalling again: it carries on within a second.
  await pedal(page, bluetooth, 0, 8);
  await expect(race.resume).toBeVisible();
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
  await page.clock.runFor(1100);
  await expect(race.paused).toHaveCount(0);
  await expect(race.pause).toBeVisible();
  await page.clock.runFor(3000);
  await expect(race.clock).not.toHaveText('0:20 / 30:00');
});

// Acceptance test
// Traces to: L2-107 AC1 to AC4
// Description: Library pauses the custom ride and asks "Leave this ride?" in a popover under it: save the ride and open
// the Class Library, discard it and open the Class Library, or keep riding with the ride still paused. Escape keeps
// riding. On a phone the popover fits within the side margins, at most 20 rem wide.
//
// Given a custom ride at 6:52, when the rider presses Library, then the ride pauses, a modal dialog reads "Leave this
// ride?" and "You’re 6:52 in with … km ridden. The ride is paused while you decide.", Library shows
// aria-expanded="true", and the focus is on "Save ride and open library".
// Given the popover, when the rider presses Escape or Keep riding, then it closes and the ride is still paused.
// Given the popover, when the rider chooses Save ride and open library, then the ride is submitted and /classes opens;
// when they choose Discard and open library, nothing is submitted and /classes opens.
// Given a phone 390 px wide, when the popover shows, then it lies within the side margins and is at most 320 px wide.
import type { Page } from '@playwright/test';
import { startCustomRide } from './fixtures/custom-ride';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { expect, test } from './fixtures/test';
import type { CustomRidePage } from './pages/custom-ride.page';

const RIDES = '/api/rides';

/** Rides to 6:52, pedalling at 72 rpm for the last 10 seconds, and opens Leave this ride?. */
async function leaveAt652(page: Page, bluetooth: FakeBluetooth, ride: CustomRidePage) {
  await page.clock.fastForward('06:42');
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  for (let second = 0; second < 10; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(72));
    await page.clock.runFor(1000);
  }
  await expect(ride.clock).toHaveText('6:52 / 30:00');
  await ride.library.click();
  await page.clock.runFor(100);
}

test('Library pauses the ride and asks to leave it (L2-107 AC1, AC2)', async ({
  page,
  bluetooth,
}) => {
  const ride = await startCustomRide(page, bluetooth);
  await leaveAt652(page, bluetooth, ride);

  await expect(ride.leave).toBeVisible();
  await expect(ride.leave).toHaveAttribute('aria-modal', 'true');
  await expect(ride.leave.locator('.ride-leave__body')).toHaveText(
    /^\s*You’re 6:52 in with \d+\.\d\d km ridden\. The ride is paused while you decide\.\s*$/,
  );
  await expect(ride.library).toHaveAttribute('aria-expanded', 'true');
  await expect(ride.saveAndLeave).toBeFocused();
  await expect(ride.discardAndLeave).toBeVisible();
  await expect(ride.keepRiding).toBeVisible();
  await page.clock.runFor(5000);
  await expect(ride.clock).toHaveText('6:52 / 30:00');

  await page.keyboard.press('Escape');
  await page.clock.runFor(100);
  await expect(ride.leave).toHaveCount(0);
  await expect(ride.library).toHaveAttribute('aria-expanded', 'false');
  await expect(ride.resume).toBeEnabled();

  await ride.library.click();
  await page.clock.runFor(100);
  await ride.keepRiding.click();
  await page.clock.runFor(5000);
  await expect(ride.leave).toHaveCount(0);
  await expect(ride.clock).toHaveText('6:52 / 30:00');
  await expect(ride.resume).toBeEnabled();
});

test('Save ride and open library submits the ride (L2-107 AC3)', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride = await startCustomRide(page, bluetooth);
  await leaveAt652(page, bluetooth, ride);

  await ride.saveAndLeave.click();
  await page.clock.runFor(100);

  await expect(page).toHaveURL(/\/classes$/);
  await expect.poll(() => api.sentBodies('POST', RIDES)).toHaveLength(1);
  expect(api.sentBodies('POST', RIDES)[0]).toMatchObject({ kind: 'custom', elapsedSeconds: 412 });
});

test('Discard and open library submits nothing (L2-107 AC3)', async ({ page, bluetooth, api }) => {
  const ride = await startCustomRide(page, bluetooth);
  await leaveAt652(page, bluetooth, ride);

  await ride.discardAndLeave.click();
  await page.clock.runFor(1000);

  await expect(page).toHaveURL(/\/classes$/);
  expect(api.sentBodies('POST', RIDES)).toEqual([]);
});

test('on a phone the popover fits within the margins (L2-107 AC4)', async ({ page, bluetooth }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const ride = await startCustomRide(page, bluetooth);
  await leaveAt652(page, bluetooth, ride);

  const box = (await ride.leave.boundingBox())!;
  expect(box.width).toBeLessThanOrEqual(320);
  expect(box.x).toBeGreaterThanOrEqual(16);
  expect(box.x + box.width).toBeLessThanOrEqual(390 - 16);
});

// Acceptance test
// Traces to: L2-108 AC1 to AC3; L2-105 AC4
// Description: End saves and submits the custom ride without a confirmation and opens Profile; the plan's end does the
// same; a ride under a minute is discarded and Profile says it was too short to save; a lost bike's ride is saved as
// far as it went.
//
// Given a custom ride at 6:52, when the rider presses End, then the ride is submitted as a custom ride of 412 seconds
// and Profile opens.
// Given a custom ride, when the clock reaches 30:00, then the ride is submitted with 1800 seconds and Profile opens.
// Given a custom ride at 0:30, when the rider presses End, then nothing is submitted and Profile reads "That ride was
// under a minute, too short to save."
// Given a custom ride whose bike was lost at 6:52, when the rider presses End, then the ride is submitted with 412
// seconds and Profile opens.
import type { Page } from '@playwright/test';
import { startCustomRide } from './fixtures/custom-ride';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { expect, test } from './fixtures/test';
import { ProfilePage } from './pages/profile.page';

const RIDES = '/api/rides';

interface Submitted {
  readonly kind: string;
  readonly elapsedSeconds: number;
  readonly distanceMeters: number;
}

/** Rides to `at`, pedalling at 72 rpm each second of the last 10 so the ride has speed and distance. */
async function rideTo(page: Page, bluetooth: FakeBluetooth, at: number): Promise<void> {
  await page.clock.fastForward((at - 10) * 1000);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  for (let second = 0; second < 10; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(72));
    await page.clock.runFor(1000);
  }
}

test('End submits the ride and opens Profile (L2-108 AC1)', async ({ page, bluetooth, api }) => {
  const ride = await startCustomRide(page, bluetooth);
  await rideTo(page, bluetooth, 412);
  await expect(ride.clock).toHaveText('6:52 / 30:00');

  await ride.end.click();
  await page.clock.runFor(100);

  await expect(page).toHaveURL(/\/profile$/);
  await expect.poll(() => api.sentBodies('POST', RIDES)).toHaveLength(1);
  const [ridden] = api.sentBodies('POST', RIDES) as Submitted[];
  expect(ridden!.kind).toBe('custom');
  expect(ridden!.elapsedSeconds).toBe(412);
  expect(ridden!.distanceMeters).toBeGreaterThan(0);
  await expect(new ProfilePage(page).notice).toHaveCount(0);
});

test('the plan’s end submits the ride as End does (L2-108 AC2)', async ({
  page,
  bluetooth,
  api,
}) => {
  await startCustomRide(page, bluetooth);
  await page.clock.fastForward('30:00');
  await page.clock.runFor(1000);

  await expect(page).toHaveURL(/\/profile$/);
  await expect.poll(() => api.sentBodies('POST', RIDES)).toHaveLength(1);
  expect((api.sentBodies('POST', RIDES) as Submitted[])[0]!.elapsedSeconds).toBe(1800);
});

test('a ride under a minute is discarded and Profile says so (L2-108 AC3)', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride = await startCustomRide(page, bluetooth);
  await page.clock.runFor(30_000);

  await ride.end.click();
  await page.clock.runFor(100);

  await expect(page).toHaveURL(/\/profile$/);
  // Profile's chunk loads and draws on the paused clock.
  await page.clock.runFor(1000);
  const profile = new ProfilePage(page);
  await expect(profile.notice).toHaveRole('status');
  await expect(profile.notice).toHaveText('That ride was under a minute, too short to save.');
  expect(api.sentBodies('POST', RIDES)).toEqual([]);
});

test('End with the bike lost saves the ride as far as it went (L2-105 AC4)', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride = await startCustomRide(page, bluetooth);
  await rideTo(page, bluetooth, 412);
  await bluetooth.switchOff();
  await bluetooth.drop();
  await page.clock.runFor(5000);
  await expect(ride.reconnect).toBeVisible();

  await ride.end.click();
  await page.clock.runFor(100);

  await expect(page).toHaveURL(/\/profile$/);
  await expect.poll(() => api.sentBodies('POST', RIDES)).toHaveLength(1);
  expect((api.sentBodies('POST', RIDES) as Submitted[])[0]!.elapsedSeconds).toBe(412);
});

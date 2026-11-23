import type { Page } from "@playwright/test";
import { RIDE_START } from "../../../frontend/e2e/fixtures/class-ride";
import { startCustomRide } from "../../../frontend/e2e/fixtures/custom-ride";
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { CustomRidePage } from "../../../frontend/e2e/pages/custom-ride.page";
import { ProfilePage } from "../../../frontend/e2e/pages/profile.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 21.4, Pause, leave or end, in the running app, through the flows of
 * e2e/custom-ride-pause, -lost, -no-bike, -leave and -end.spec.ts: the ride paused at 6:52; the bike lost; the ride
 * waiting for a bike, and with Bluetooth off; "Leave this ride?" under Library, at 390, 768, 1024 and 1440 px; and
 * Profile after a ride too short to save. Only `node tools/video-record/record.mjs docs/videos/21-4-pause-leave-or-end`.
 */

/** Rides to 6:52 on level 6, pedalling at 72 to 74 rpm for the last 22 seconds, so the trace has a line to draw. */
async function rideTo652(page: Page, bluetooth: FakeBluetooth, ride: CustomRidePage): Promise<void> {
  await page.clock.fastForward("05:30");
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  await page.clock.fastForward("01:00");
  for (let second = 0; second < 22; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(72 + (second % 3)));
    await page.clock.runFor(1000);
  }
  await expect(ride.clock).toHaveText("6:52 / 30:00");
}

/**
 * Lets the clock run again, the ride held: a capture waits two animation frames, which the paused clock never gives.
 */
async function capturable(page: Page): Promise<void> {
  await page.clock.resume();
  await page.mouse.move(0, 0);
}

test("the ride paused at 6:52", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  const ride = await startCustomRide(page, bluetooth);
  await rideTo652(page, bluetooth, ride);
  await ride.pause.click();
  await page.clock.runFor(100);
  await expect(ride.resume).toBeEnabled();
  await capturable(page);
  await shot(page, "paused");
  await detail(page.locator(".ride-header__end"), "resume", 12);
});

test("the bike lost at 6:52", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  const ride = await startCustomRide(page, bluetooth);
  await rideTo652(page, bluetooth, ride);
  await bluetooth.switchOff();
  await bluetooth.drop();
  await page.clock.runFor(100);
  await expect(ride.reconnect).toBeVisible();
  await capturable(page);
  await shot(page, "lost");
  await detail(ride.overlay, "lost-alert", 32);
});

test("waiting for a bike", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await page.clock.install({ time: RIDE_START });
  await bluetooth.remember(echelonBike);
  await bluetooth.switchOff();
  const ride = new CustomRidePage(page);
  await ride.open();
  await expect(ride.connectBike).toBeVisible();
  await page.clock.runFor(1000);
  await capturable(page);
  await shot(page, "no-bike");
});

test("Bluetooth off", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await bluetooth.adapterOff();
  const ride = new CustomRidePage(page);
  await ride.open();
  await expect(ride.checkAgain).toBeVisible();
  await page.mouse.move(0, 0);
  await detail(ride.overlay, "bluetooth-off", 32);
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Leave this ride? at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    const ride = await startCustomRide(page, bluetooth);
    await rideTo652(page, bluetooth, ride);
    await ride.library.click();
    await page.clock.runFor(100);
    await expect(ride.saveAndLeave).toBeFocused();
    await capturable(page);
    await shot(page, `leave-${size.toLowerCase()}`);
    if (size === "XL") await detail(ride.leave, "leave", 24);
  });
}

test("Profile after a ride too short to save", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  const ride = await startCustomRide(page, bluetooth);
  await page.clock.runFor(30_000);
  await ride.end.click();
  const profile = new ProfilePage(page);
  await expect(async () => {
    await page.clock.runFor(100);
    await expect(profile.notice).toBeVisible({ timeout: 50 });
  }).toPass();
  await capturable(page);
  await shot(page, "too-short");
});

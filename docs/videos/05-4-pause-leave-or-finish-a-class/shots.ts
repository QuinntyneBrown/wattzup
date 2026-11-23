import type { Locator, Page } from "@playwright/test";
import { startClassRide } from "../../../frontend/e2e/fixtures/class-ride";
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import type { YouTubeFixture } from "../../../frontend/e2e/fixtures/youtube";
import type { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import {
  type Size,
  detail as detailOf,
  frame,
  shot as shotOf,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 5.4, Pause, leave or finish a class, in the running app: 30 Minute HIIT Cardio
 * ridden solo and paused at 7:00, at 390, 768, 1024 and 1440 px, and with the bike lost at 7:00, the alert over the
 * ride. The shared fixture's fake Bluetooth stands in for the bike, its API fixture answers the class, and its YouTube
 * fixture answers the IFrame API with a fake player over the class cover; Playwright's clock moves the ride, as the
 * acceptance specs do. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/05-4-pause-leave-or-finish-a-class`.
 */

/**
 * A screenshot settles on two animation frames, which the paused clock holds back, so the clock steps one 16 ms frame
 * for each 50 ms of real time until it is taken: a few frames a shot, so the ride's clock and countdown do not move.
 */
async function still(page: Page, take: () => Promise<void>): Promise<void> {
  let done = false;
  const taken = take().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
}
const shot = (page: Page, name: string) => still(page, () => shotOf(page, name));
const detail = (region: Locator, name: string, pad: number) =>
  still(region.page(), () => detailOf(region, name, pad));

/** Moves the ride to 7:00 with the bike reporting 73 rpm at resistance 6, and lets the page render. */
async function atSeven(
  page: Page,
  bluetooth: FakeBluetooth,
  youtube: YouTubeFixture,
  ride: ClassRidePage,
): Promise<void> {
  await expect.poll(async () => (await youtube.players()).length).toBe(1);
  await page.clock.runFor(100);
  await page.clock.fastForward("07:00");
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(73));
  await page.clock.runFor(100);
  await expect(ride.powerHint).toHaveText("On target");
  await page.evaluate(() => document.fonts.ready);
  await expect(ride.cover).toHaveJSProperty("complete", true);
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Class ride paused at 7:00 at ${size}`, async ({ page, bluetooth, api, youtube }) => {
    await frame(page, size);
    const ride = await startClassRide(page, bluetooth, api);
    await atSeven(page, bluetooth, youtube, ride);
    await ride.pause.click();
    await page.clock.runFor(100);
    await expect(ride.paused).toHaveText("Paused");
    await shot(page, `paused-${size.toLowerCase()}`);
    if (size === "M") await detail(page.locator("wz-class-video"), "frame", 12);
    await expect(ride.clock).toHaveText("7:00 / 30:00");
  });
}

for (const size of ["XS", "XL"] as Size[]) {
  test(`Class ride with the bike lost at ${size}`, async ({ page, bluetooth, api, youtube }) => {
    await frame(page, size);
    const ride = await startClassRide(page, bluetooth, api);
    await atSeven(page, bluetooth, youtube, ride);
    await bluetooth.switchOff();
    await bluetooth.drop();
    await page.clock.runFor(1000);
    await expect(ride.lost).toBeVisible();
    await shot(page, `lost-${size.toLowerCase()}`);
    if (size === "XL") await detail(page.locator(".class-lost__card"), "lost", 24);
  });
}

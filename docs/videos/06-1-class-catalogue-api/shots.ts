import type { Locator, Page } from "@playwright/test";
import { startClassRide } from "../../../frontend/e2e/fixtures/class-ride";
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import {
  type Size,
  detail as detailOf,
  frame,
  shot as shotOf,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 6.1, Class catalogue API, in the running app: 30 Minute HIIT Cardio ridden solo
 * after a reload with the backend unreachable, its class read from the catalogue the app kept, at 390, 768, 1024 and
 * 1440 px. The shared fixture's API fixture serves the catalogue once and then answers 503; its fake Bluetooth stands
 * in for the bike and its YouTube fixture for the player; Playwright's clock moves the ride, as the acceptance specs
 * do. Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/06-1-class-catalogue-api`.
 */

/**
 * A screenshot settles on two animation frames, which the paused clock holds back, so the clock steps one 16 ms frame
 * for each 50 ms of real time until it is taken.
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

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Class ride from the kept catalogue at ${size}`, async ({ page, bluetooth, api, youtube }) => {
    await frame(page, size);
    // The first visit reads the catalogue, and the app keeps it.
    let ride = await startClassRide(page, bluetooth, api);
    await expect(ride.name).toContainText("30 Minute HIIT Cardio");
    // Then the backend cannot be reached, and the ride opens again from the kept catalogue.
    api.answer("GET", "/api/classes", () => ({ status: 503 }));
    await page.reload();
    await expect(async () => {
      await page.clock.runFor(100);
      await expect(ride.name).toContainText("30 Minute HIIT Cardio", { timeout: 50 });
    }).toPass();
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    await page.clock.runFor(100);
    await page.clock.fastForward("07:00");
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(73));
    await page.clock.runFor(100);
    await expect(ride.powerHint).toHaveText("On target");
    await page.evaluate(() => document.fonts.ready);
    await expect(ride.cover).toHaveJSProperty("complete", true);
    await shot(page, `offline-${size.toLowerCase()}`);
    if (size === "XL") await detail(page.locator("wz-class-segment"), "segment", 12);
  });
}

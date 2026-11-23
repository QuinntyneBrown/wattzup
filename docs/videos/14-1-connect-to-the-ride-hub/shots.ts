import type { Page } from "@playwright/test";
import { RIDE_START } from "../../../frontend/e2e/fixtures/class-ride";
import { catalogue, hiitCardio } from "../../../frontend/e2e/fixtures/classes";
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  echelonBike,
  resistanceFrame,
  targetResistanceWrite,
  workoutFrame,
} from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { type Size, detail as detailOf, frame, shot as shotOf } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 14.1, Connect to the ride hub, in the running app: 30 Minute HIIT Cardio ridden
 * in a group session at 7:00, holding its connection to the ride hub, at 390, 768, 1024 and 1440 px, its bike panel at
 * 1440 px, and Home, which holds none. The shared fixture's hub answers the connection and ServerTime, its fake
 * Bluetooth stands in for the bike and its YouTube fixture for the class video; Playwright's clock moves the ride, as
 * the acceptance specs do. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/14-1-connect-to-the-ride-hub`.
 */

/** Steps the paused clock one frame per 50 ms of real time while a screenshot settles, as slice 5.4's film does. */
async function still(page: Page, take: () => Promise<void>): Promise<void> {
  let done = false;
  const taken = take().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`a group class ride at 7:00 at ${size}`, async ({ page, bluetooth, api, hub, youtube }) => {
    await frame(page, size);
    hub.open();
    hub.answer("ServerTime", () => RIDE_START + 61_500);
    let answer: (body: unknown) => void = () => undefined;
    const held = new Promise((resolve) => (answer = resolve));
    api.answer("GET", "/api/classes", async () => ({ body: await held }));
    await page.clock.install({ time: RIDE_START });
    await bluetooth.remember(echelonBike);
    const ride = new ClassRidePage(page);
    await ride.openGroup(hiitCardio.id, "session-0715");
    await expect.poll(() => bluetooth.log()).toEqual(ECHELON_INITIALISED);
    // The ride joins its session as it opens: the connection and the clock offset come before the clock is paused.
    await expect.poll(() => hub.invocations("ServerTime").length).toBe(5);
    await page.clock.pauseAt(RIDE_START + 60_000);
    answer(catalogue);
    await expect.poll(() => bluetooth.writes().map((write) => write.hex)).toContain(targetResistanceWrite(8));
    await page.clock.runFor(100);
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    await page.clock.runFor(100);
    await page.clock.fastForward("07:00");
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(73));
    await page.clock.runFor(100);
    await expect(ride.powerHint).toHaveText("On target");
    await page.evaluate(() => document.fonts.ready);
    await expect(ride.cover).toHaveJSProperty("complete", true);
    await page.mouse.move(0, 0);
    await still(page, () => shotOf(page, `group-${size.toLowerCase()}`));
    if (size === "XL") await still(page, () => detailOf(page.locator("wz-class-bike"), "bike-xl", 12));
  });
}

test("Home holds no hub connection, at XL", async ({ page, bluetooth, hub }) => {
  await frame(page, "XL");
  await bluetooth.remember(echelonBike);
  const home = new HomePage(page);
  await home.open();
  await expect(home.header.link("Home")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await shotOf(page, "home-xl");
  expect(hub.negotiations()).toBe(0);
});

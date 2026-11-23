import type { Page } from "@playwright/test";
import { startClassRide } from "../../../frontend/e2e/fixtures/class-ride";
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { startRace } from "../../../frontend/e2e/fixtures/race";
import { hideTab, showTab } from "../../../frontend/e2e/fixtures/tab";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 18.2, Keep the ride clock true, in the running app: a solo race on Old Town
 * Criterium at 0:10, then shown again after 10 minutes in a hidden tab whose timers were throttled to once a minute
 * while the bike notified each second, at 10:10 in the second recovery with 3.97 km ridden, at 390, 768, 1024 and 1440
 * px; and 30 Minute HIIT Cardio's ride the same way at 1440 px. The shared fixture's fake Bluetooth plays the bike and
 * Playwright's clock moves the ride. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/18-2-keep-the-ride-clock-true`.
 */

/** Steps the paused clock one frame per 50 ms of real time while a screenshot settles, as slice 15.3's film does. */
async function still(page: Page, take: () => Promise<void>): Promise<void> {
  let done = false;
  const taken = take().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
}

/** Rides at 85 rpm for `seconds`, a notification from the bike each second. */
async function ride(page: Page, bluetooth: FakeBluetooth, seconds: number): Promise<void> {
  for (let second = 0; second < seconds; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
    await page.clock.runFor(1000);
  }
}

/** Hides the tab with its timers throttled for 10 minutes of riding, then shows it again. */
async function awayTenMinutes(page: Page, bluetooth: FakeBluetooth): Promise<void> {
  await hideTab(page, { throttled: true });
  await ride(page, bluetooth, 600);
  await showTab(page);
  await page.clock.runFor(16);
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`a race shown again after 10 minutes hidden, at ${size}`, async ({ page, bluetooth, api }) => {
    await frame(page, size);
    const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=solo");
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(16));
    await ride(page, bluetooth, 10);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    if (size === "XL") {
      await expect(race.clock).toHaveText(/^0:10 /);
      await still(page, () => shot(page, "race-before-xl"));
      await still(page, () => detail(race.interval, "interval-before", 16));
      await still(page, () => detail(race.routePanel, "route-before", 16));
    }
    await awayTenMinutes(page, bluetooth);
    await expect(race.clock).toHaveText(/^10:10 /);
    await expect(race.distance).toHaveText("3.97 km");
    await still(page, () => shot(page, `race-after-${size.toLowerCase()}`));
    if (size !== "XL") return;
    await still(page, () => detail(race.interval, "interval-after", 16));
    await still(page, () => detail(race.routePanel, "route-after", 16));
  });
}

test("a class ride shown again after 10 minutes hidden, at XL", async ({ page, bluetooth, api }) => {
  await frame(page, "XL");
  const ride10 = await startClassRide(page, bluetooth, api);
  await ride(page, bluetooth, 10);
  await awayTenMinutes(page, bluetooth);
  await expect(ride10.clock).toHaveText("10:10 / 30:00");
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await still(page, () => shot(page, "class-after-xl"));
});

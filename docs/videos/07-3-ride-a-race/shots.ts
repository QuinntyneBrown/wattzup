import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import { startRace } from "../../../frontend/e2e/fixtures/race";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import {
  type Size,
  detail as detailOf,
  frame,
  pictures,
  shot as shotOf,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 7.3, Ride a race, in the running app: a race on Old Town Criterium against
 * medium bots at 5:01, after a warm-up ridden at 80 rpm, one second into the first effort at 87 rpm (371 W), at 390,
 * 768, 1024 and 1440 px, with close-ups of the power, interval, route and resistance panels. The fake Bluetooth plays
 * the bike and the shared fixture's API fixture serves the map catalogue. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/07-3-ride-a-race`.
 */

/**
 * A screenshot settles on two animation frames, which the paused clock holds back, so the clock steps one 16 ms frame
 * for each 50 ms of real time until it is taken (as in the film of slice 5.3): the race's clock does not move.
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
  test(`The race at ${size}`, async ({ page, bluetooth, api }) => {
    test.setTimeout(120_000);
    await frame(page, size);
    const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=bots&pack=medium");
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(8));
    // The warm-up at 80 rpm on level 8 (143 W); cadence is sent every 4 s, inside its 5-second timeout.
    for (let second = 0; second < 300; second += 4) {
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
      await page.clock.runFor(4000);
    }
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(24));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(87));
    await page.clock.runFor(1100);
    await expect(race.clock).toHaveText("5:01 / 30:00");
    await expect(race.watts).toHaveText("371W");
    await still(page, () => pictures(page));
    await shot(page, `race-${size.toLowerCase()}`);
    if (size === "XS") {
      await detail(race.power, "power", 12);
      await detail(race.interval, "interval", 12);
    }
    if (size === "XL") {
      await detail(race.routePanel, "route", 12);
      await detail(race.resistPanel, "resist", 12);
    }
  });
}

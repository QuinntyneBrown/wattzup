import type { Locator, Page } from "@playwright/test";
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { startRace } from "../../../frontend/e2e/fixtures/race";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import {
  type Size,
  detail as detailOf,
  frame,
  pictures,
  shot as shotOf,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 7.4, Ghost and bots, in the running app: a race on Old Town Criterium against
 * the medium pack at 5:01, after a warm-up ridden at 90 rpm on level 10 (189 W, the pack's pace), one second into the
 * first effort at 87 rpm (371 W), at 390, 768, 1024 and 1440 px, with close-ups of the board and the power panel's
 * place; and a solo race against the ghost, which with no best rides the medium pace. The fake Bluetooth plays the
 * bike and the shared fixture's API fixture serves the map catalogue. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/07-4-ghost-and-bots`.
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

/** The warm-up at `rpm` on `level`, cadence sent every 4 s inside its 5-second timeout, then the first effort. */
async function toFiveOhOne(page: Page, bluetooth: FakeBluetooth, rpm: number, level: number): Promise<void> {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(level));
  for (let second = 0; second < 300; second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(rpm));
    await page.clock.runFor(4000);
  }
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(24));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(87));
  await page.clock.runFor(1100);
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`A bots race at ${size}`, async ({ page, bluetooth, api }) => {
    test.setTimeout(120_000);
    await frame(page, size);
    const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=bots&pack=medium");
    await toFiveOhOne(page, bluetooth, 90, 10);
    await expect(race.clock).toHaveText("5:01 / 30:00");
    await expect(race.boardRows).toHaveCount(10);
    await still(page, () => pictures(page));
    await shot(page, `bots-${size.toLowerCase()}`);
    if (size === "XS") await detail(race.power, "power", 12);
    if (size === "XL") await detail(race.board, "board", 12);
  });
}

test("A solo race against the ghost", async ({ page, bluetooth, api }) => {
  test.setTimeout(120_000);
  await frame(page, "XL");
  const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=solo");
  await toFiveOhOne(page, bluetooth, 80, 8);
  await expect(race.boardTitle).toHaveText("You vs your best");
  await still(page, () => pictures(page));
  await shot(page, "solo-xl");
  await detail(race.board, "solo-board", 12);
  await detail(race.power, "solo-power", 12);
});

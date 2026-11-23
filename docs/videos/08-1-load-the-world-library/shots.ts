import type { Page } from "@playwright/test";
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { startRace } from "../../../frontend/e2e/fixtures/race";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { RaceSetupPage } from "../../../frontend/e2e/pages/race-setup.page";
import type { RacePage } from "../../../frontend/e2e/pages/race.page";
import {
  type Size,
  detail as detailOf,
  frame,
  pictures,
  shot as shotOf,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 8.1, Load the world library, in the running app on Old Town Criterium: a bots
 * race whose world has started, at 390, 768, 1024 and 1440 px, with the bar's renderer tag at 768 px; the same race
 * where neither WebGPU nor WebGL 2 can draw, its panorama alone; and Race Setup after leaving the race. The browser
 * has no WebGPU (the shared fixture's `webgl`), so the world draws with WebGL 2. The fake Bluetooth plays the bike
 * and the API fixture serves the map catalogue. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/08-1-load-the-world-library`.
 */

/** A screenshot settles on animation frames the paused clock holds back, so the clock steps 16 ms each 50 ms. */
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

/** The world starts after 30 measured frames: the paused clock steps a frame at a time until `shown` holds. */
async function stepUntil(page: Page, shown: () => Promise<void>): Promise<void> {
  await expect(async () => {
    await page.clock.runFor(16);
    await shown();
  }).toPass({ intervals: [0] });
}

/** Rides `rpm` on `level` for `seconds`, a frame every 4 s inside cadence's 5-second timeout. */
async function ride(page: Page, bluetooth: FakeBluetooth, level: number, rpm: number, seconds: number) {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(level));
  for (let second = 0; second < seconds; second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(rpm));
    await page.clock.runFor(4000);
  }
}

const settle = async (page: Page, race: RacePage) => {
  await expect(race.clock).toBeVisible();
  await still(page, () => pictures(page));
};

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`A race with its world at ${size}`, async ({ page, bluetooth, api, webgl }) => {
    test.setTimeout(120_000);
    await webgl.withoutWebGpu();
    await frame(page, size);
    const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=bots&pack=medium");
    // Started: the bar has its tag (hidden on a phone, where the bar has no room for it).
    await stepUntil(page, () => expect(race.backend).toHaveCount(1, { timeout: 50 }));
    await ride(page, bluetooth, 10, 90, 40);
    if (size !== "XS") await expect(race.backend).toHaveText("WebGL 2");
    await settle(page, race);
    if (size === "M") await still(page, () => detailOf(race.bar, "tag-m", 12));
    await shot(page, `world-${size.toLowerCase()}`);
  });
}

test("A race where neither WebGPU nor WebGL 2 can draw", async ({ page, bluetooth, api, webgl }) => {
  test.setTimeout(120_000);
  await webgl.disable();
  await frame(page, "XL");
  const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=bots&pack=medium");
  await stepUntil(page, () => expect(race.world).toHaveCount(0, { timeout: 50 }));
  await ride(page, bluetooth, 10, 90, 40);
  await expect(race.backend).toHaveCount(0);
  await settle(page, race);
  await shot(page, "panorama-xl");
});

test("Race Setup after leaving the race", async ({ page, bluetooth, api, webgl }) => {
  test.setTimeout(120_000);
  await webgl.withoutWebGpu();
  await frame(page, "XL");
  const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=bots&pack=medium");
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  await race.leave.click();
  await stepUntil(page, () => expect(new RaceSetupPage(page).title).toBeVisible({ timeout: 50 }));
  await expect(race.world).toHaveCount(0);
  await still(page, () => pictures(page));
  await shot(page, "left-xl");
});

import type { Page } from "@playwright/test";
import { startClassRide } from "../../../frontend/e2e/fixtures/class-ride";
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { maps } from "../../../frontend/e2e/fixtures/maps";
import { startRace } from "../../../frontend/e2e/fixtures/race";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { type Size, frame, pictures, shot as shotOf } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 10.1, Record a ride, in the running app: a bots race on Old Town Criterium,
 * served 0.5 km long, nearing the line, and the HIIT Cardio class in its last seconds, at 390 and 1440 px. One race then
 * crosses the line and prints the ride the app submitted. The fake Bluetooth plays the bike and the shared fixture's API
 * fixture serves the catalogues and records the ride. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/10-1-record-a-ride`.
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

/** Rides `rpm` on `level` for `seconds`, a frame every 4 s inside cadence's 5-second timeout. */
async function ride(page: Page, bluetooth: FakeBluetooth, level: number, rpm: number, seconds: number) {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(level));
  for (let second = 0; second < seconds && !page.url().endsWith("/results"); second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(rpm));
    await page.clock.runFor(4000);
  }
}

const catalogue = maps.map((map) => (map.id === "old-town-criterium" ? { ...map, distanceKm: 0.5 } : map));

for (const size of ["XS", "XL"] as Size[]) {
  test(`A bots race nearing the line at ${size}`, async ({ page, bluetooth, api }) => {
    test.setTimeout(120_000);
    await frame(page, size);
    const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=bots&pack=medium", { catalogue });
    await ride(page, bluetooth, 32, 120, 52);
    await expect(race.clock).toBeVisible();
    await still(page, () => pictures(page));
    await shot(page, `line-${size.toLowerCase()}`);
  });

  test(`A class in its last seconds at ${size}`, async ({ page, bluetooth, api, youtube }) => {
    test.setTimeout(120_000);
    await frame(page, size);
    const ride = await startClassRide(page, bluetooth, api);
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    await page.clock.runFor(100);
    await page.clock.fastForward("29:50");
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(73));
    await page.clock.runFor(100);
    await expect(ride.clock).toHaveText("29:50 / 30:00");
    await page.evaluate(() => document.fonts.ready);
    await expect(ride.cover).toHaveJSProperty("complete", true);
    await shot(page, `class-end-${size.toLowerCase()}`);
  });
}

test("A bots race over the line, and the ride it submitted", async ({ page, bluetooth, api }) => {
  test.setTimeout(120_000);
  await frame(page, "XL");
  await startRace(page, bluetooth, api, "old-town-criterium", "mode=bots&pack=medium", { catalogue });
  await ride(page, bluetooth, 32, 120, 120);
  await expect.poll(() => api.sentBodies("POST", "/api/rides")).toHaveLength(1);
  const [submitted] = api.sentBodies("POST", "/api/rides") as { speedSamplesKmh: number[] }[];
  console.log(JSON.stringify({ ...submitted, speedSamplesKmh: submitted.speedSamplesKmh.length }));
});

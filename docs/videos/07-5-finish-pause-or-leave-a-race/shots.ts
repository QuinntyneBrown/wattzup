import type { Page } from "@playwright/test";
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { maps } from "../../../frontend/e2e/fixtures/maps";
import { startRace } from "../../../frontend/e2e/fixtures/race";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import type { RacePage } from "../../../frontend/e2e/pages/race.page";
import {
  type Size,
  detail as detailOf,
  frame,
  pictures,
  shot as shotOf,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 7.5, Finish, pause or leave a race, in the running app on Old Town Criterium: a
 * solo race paused at 1:00 at 390, 768, 1024 and 1440 px; the bar's controls at 768 px, Leave in a bots race and Pause
 * and End in a solo one; a bots race with the bike lost, then ended as a DNF; a solo race parked by the lost bike; and a
 * bots race nearing the line on the course served 0.5 km long. The fake Bluetooth plays the bike and the shared
 * fixture's API fixture serves the map catalogue. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/07-5-finish-pause-or-leave-a-race`.
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
  for (let second = 0; second < seconds; second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(rpm));
    await page.clock.runFor(4000);
  }
}

async function loseTheBike(page: Page, bluetooth: FakeBluetooth) {
  await bluetooth.switchOff();
  await bluetooth.drop();
  await page.clock.runFor(1000);
}

const settle = async (page: Page, race: RacePage) => {
  await expect(race.clock).toBeVisible();
  await still(page, () => pictures(page));
};

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`A paused solo race at ${size}`, async ({ page, bluetooth, api }) => {
    test.setTimeout(120_000);
    await frame(page, size);
    const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=solo");
    await ride(page, bluetooth, 10, 90, 60);
    if (size === "M") await still(page, () => detailOf(race.controls, "bar-solo", 12));
    await race.pause.click();
    await page.clock.runFor(100);
    await expect(race.paused).toBeVisible();
    await settle(page, race);
    await shot(page, `paused-${size.toLowerCase()}`);
  });
}

test("The bar of a bots race", async ({ page, bluetooth, api }) => {
  test.setTimeout(120_000);
  await frame(page, "M");
  const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=bots&pack=medium");
  await ride(page, bluetooth, 10, 90, 60);
  await settle(page, race);
  await still(page, () => detailOf(race.controls, "bar-bots", 12));
});

test("A bots race with the bike lost, then a DNF", async ({ page, bluetooth, api }) => {
  test.setTimeout(120_000);
  await frame(page, "XL");
  const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=bots&pack=medium");
  await ride(page, bluetooth, 32, 120, 60);
  await loseTheBike(page, bluetooth);
  await page.clock.runFor(4000);
  await expect(race.lost).toContainText("Lost the bike");
  await settle(page, race);
  await shot(page, "lost-xl");
  await page.clock.runFor(12_000);
  await expect(race.lost).toContainText("Did not finish");
  await settle(page, race);
  await shot(page, "dnf-xl");
});

test("A solo race parked by the lost bike", async ({ page, bluetooth, api }) => {
  test.setTimeout(120_000);
  await frame(page, "XL");
  const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=solo");
  await ride(page, bluetooth, 10, 90, 60);
  await loseTheBike(page, bluetooth);
  await expect(race.lost).toContainText("parked");
  await settle(page, race);
  await shot(page, "parked-xl");
});

test("A bots race nearing the line", async ({ page, bluetooth, api }) => {
  test.setTimeout(120_000);
  await frame(page, "XL");
  const catalogue = maps.map((map) => (map.id === "old-town-criterium" ? { ...map, distanceKm: 0.5 } : map));
  const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=bots&pack=medium", { catalogue });
  await ride(page, bluetooth, 32, 120, 52);
  await expect(race.you).toHaveText(/^1You$/);
  await settle(page, race);
  await shot(page, "line-xl");
});

import type { Locator, Page } from "@playwright/test";
import { appCached } from "../../../frontend/e2e/fixtures/app-cache";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { startRace } from "../../../frontend/e2e/fixtures/race";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { MapSelectPage } from "../../../frontend/e2e/pages/map-select.page";
import { RacePage } from "../../../frontend/e2e/pages/race.page";
import { type Size, detail as detailOf, frame, shot as shotOf } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 17.2, Cache the app, in the running app with its service worker: a solo race on
 * Prairie Paceline started with no network once the app had been opened (at 390, 768, 1024 and 1440 px), its board
 * close up, and Map Select opened again with no network, its covers drawn from the app cache. While online, Map Select
 * is opened twice (before and after the worker takes control) and the map's photo is read once through the worker, as
 * a ride on that map would. The worker is in the production build only, so the recorder reuses a production build
 * served on its port first (`npx ng build ride && node scripts/serve-dist.mjs 4310` in `frontend/`). Not a test and not
 * a sweep: only `node tools/video-record/record.mjs docs/videos/17-2-cache-the-app`.
 */

test.use({ serviceWorkers: "allow" });

/** Moves the pointer out of the picture. */
async function still(page: Page): Promise<void> {
  await page.mouse.move(0, 0);
}

/**
 * A screenshot settles on two animation frames, which the race's paused clock holds back, so the clock steps one 16 ms
 * frame for each 50 ms of real time until it is taken (as in the film of slice 7.4). Map Select has no paused clock.
 */
async function stepped(page: Page, take: () => Promise<void>): Promise<void> {
  let done = false;
  const taken = take().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
}
const raceShot = (page: Page, name: string) => stepped(page, () => shotOf(page, name));
const raceDetail = (region: Locator, name: string, pad: number) =>
  stepped(region.page(), () => detailOf(region, name, pad));

/** Opens the app online until the worker keeps it, with the progress and the map's world read through it. */
async function cacheTheApp(page: Page): Promise<MapSelectPage> {
  const select = new MapSelectPage(page);
  await select.open();
  await expect(select.rows).toHaveCount(7);
  await appCached(page);
  await page.reload();
  await expect(select.rows).toHaveCount(7);
  await page.evaluate(() => fetch("/maps/prairie-paceline-photo.jpg").then((answer) => answer.blob()));
  return select;
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`A solo race with no network, at ${size}`, async ({ page, context, bluetooth, api }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    await cacheTheApp(page);
    await context.setOffline(true);
    api.offline();
    const race = await startRace(page, bluetooth, api, "prairie-paceline", "mode=solo", { offline: true });
    await page.clock.runFor(30_000);
    await expect(race.boardNames).toHaveText(["Your best", "You"]);
    await expect.poll(() => race.panorama.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await still(page);
    await raceShot(page, `offline-${size.toLowerCase()}`);
    if (size === "XL") await raceDetail(new RacePage(page).board, "offline-board", 24);
  });
}

test("Map Select opened again with no network, at XL", async ({ page, context, bluetooth, api }) => {
  await frame(page, "XL");
  await bluetooth.remember(echelonBike);
  const select = await cacheTheApp(page);
  const oldTown = select.row("Old Town Criterium");
  await expect.poll(() => oldTown.thumbnailDrawn()).toBe(true);
  await context.setOffline(true);
  api.offline();
  await page.reload();
  await expect(select.rows).toHaveCount(7);
  await expect.poll(() => oldTown.thumbnailDrawn()).toBe(true);
  await still(page);
  await shotOf(page, "covers-xl");
  await detailOf(select.rows.first(), "covers-row", 24);
});

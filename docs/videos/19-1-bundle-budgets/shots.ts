import type { Page } from "@playwright/test";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { startRace, stepUntil } from "../../../frontend/e2e/fixtures/race";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 19.1, Bundle budgets, in the running production build: Home's first load, which
 * carries no 3D code, at 390, 768, 1024 and 1440 px; and a solo race on Old Town Criterium drawing its world with WebGL
 * 2, the world's code downloaded only then, at 1440 px. The shared fixture's fake Bluetooth plays the bike. Not a test
 * and not a sweep: only `node tools/video-record/record.mjs docs/videos/19-1-bundle-budgets`.
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

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Home's first load, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const home = new HomePage(page);
    await home.open();
    await expect(home.main).toBeAttached();
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    await shot(page, `home-${size.toLowerCase()}`);
    if (size === "XL") await detail(home.header.lockup, "lockup", 16);
  });
}

test("a race drawing its world, at XL", async ({ page, bluetooth, api, webgl }) => {
  await frame(page, "XL");
  await webgl.withoutWebGpu();
  const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=solo", { world: true });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  for (let i = 0; i < 20; i++) await page.clock.runFor(16);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await still(page, () => shot(page, "race-world-xl"));
  await still(page, () => detail(race.backend, "world-tag", 16));
});

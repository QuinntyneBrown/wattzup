import type { Page } from "@playwright/test";
import { startRace, stepUntil } from "../../../frontend/e2e/fixtures/race";
import { hideTab, showTab } from "../../../frontend/e2e/fixtures/tab";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { type Size, frame, pictures, shot as shotOf } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 8.6, Panorama and hidden tab, in the running app: a race on Old Town Criterium
 * with its world at Low at 1440 px, and the same race back from a hidden tab; and a race where neither WebGPU nor
 * WebGL 2 can draw, on the map's panorama, at 390, 768, 1024 and 1440 px. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/08-6-panorama-and-hidden-tab`.
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

test("the world, hidden and back, at XL", async ({ page, bluetooth, api, webgl, worldRide }) => {
  test.setTimeout(600_000);
  await webgl.withoutWebGpu();
  await worldRide.pin("low");
  await frame(page, "XL");
  const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=bots&pack=medium", { world: true });
  await stepUntil(page, () => expect(race.backend).toHaveCount(1, { timeout: 50 }));
  await page.clock.runFor(1000);
  await still(page, () => pictures(page));
  await shot(page, "world-xl");
  await hideTab(page);
  await page.clock.runFor(20_000);
  await showTab(page);
  await page.clock.runFor(1000);
  await still(page, () => pictures(page));
  await shot(page, "back-xl");
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the panorama at ${size}`, async ({ page, bluetooth, api, webgl }) => {
    await webgl.disable();
    await frame(page, size);
    const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=bots&pack=medium");
    await stepUntil(page, () => expect(race.world).toHaveCount(0, { timeout: 50 }));
    await page.clock.runFor(3000);
    await expect(race.panorama).toBeVisible();
    await still(page, () => pictures(page));
    await shot(page, `panorama-${size.toLowerCase()}`);
  });
}

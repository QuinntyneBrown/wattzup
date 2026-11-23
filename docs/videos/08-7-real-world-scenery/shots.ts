import type { Page } from "@playwright/test";
import { startRace, stepUntil } from "../../../frontend/e2e/fixtures/race";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { type Size, frame, pictures, shot as shotOf } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 8.7, Real-world scenery, in the running app: a solo race on Old Town Criterium
 * with its world drawn at Low, offering the real Bruges; the panel with a key Google refused, and streaming with
 * Google's credit, at 1440 px; and the offer at 390, 768 and 1024 px. Google's answers come from the shared fixture's
 * `mapTiles`, so no request leaves the machine. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/08-7-real-world-scenery`.
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
const KEY = "AIzaSyD-8w2kQx";

type Fixtures = Pick<Parameters<Parameters<typeof test>[1]>[0], "page" | "bluetooth" | "api" | "webgl" | "worldRide">;

async function oldTown({ page, bluetooth, api, webgl, worldRide }: Fixtures, size: Size) {
  await webgl.withoutWebGpu();
  await worldRide.pin("low");
  await frame(page, size);
  const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=solo", { world: true });
  await stepUntil(page, () => expect(race.scenery).toHaveCount(1, { timeout: 50 }));
  await page.clock.runFor(1000);
  return race;
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the offer at ${size}`, async ({ page, bluetooth, api, webgl, worldRide }) => {
    test.setTimeout(300_000);
    await oldTown({ page, bluetooth, api, webgl, worldRide }, size);
    await still(page, () => pictures(page));
    await shot(page, `offer-${size.toLowerCase()}`);
  });
}

test("refused at XL", async ({ page, bluetooth, api, webgl, worldRide, mapTiles }) => {
  test.setTimeout(300_000);
  mapTiles.refuse();
  const race = await oldTown({ page, bluetooth, api, webgl, worldRide }, "XL");
  await race.sceneryKey.fill(KEY);
  await stepUntil(page, () => expect(race.streamIt).toBeEnabled({ timeout: 50 }));
  await race.streamIt.click();
  await stepUntil(page, () => expect(race.sceneryError).toBeVisible({ timeout: 50 }));
  await still(page, () => pictures(page));
  await shot(page, "refused-xl");
});

test("streaming at XL", async ({ page, bluetooth, api, webgl, worldRide, mapTiles }) => {
  test.setTimeout(300_000);
  mapTiles.accept();
  const race = await oldTown({ page, bluetooth, api, webgl, worldRide }, "XL");
  await race.sceneryKey.fill(KEY);
  await stepUntil(page, () => expect(race.streamIt).toBeEnabled({ timeout: 50 }));
  await race.streamIt.click();
  await stepUntil(page, () => expect(race.sceneryCredit).toBeVisible({ timeout: 50 }));
  await still(page, () => pictures(page));
  await shot(page, "streaming-xl");
});

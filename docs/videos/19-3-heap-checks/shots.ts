import type { Page } from "@playwright/test";
import { startClassRide } from "../../../frontend/e2e/fixtures/class-ride";
import { startRace, stepUntil } from "../../../frontend/e2e/fixtures/race";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassStartPage } from "../../../frontend/e2e/pages/class-start.page";
import { RaceSetupPage } from "../../../frontend/e2e/pages/race-setup.page";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 19.3, Heap checks, in the running app: the screens the heap checks enter and
 * leave. A solo race drawing its world with WebGL 2 and Race Setup once it is left, at 1440 px; and 30 Minute HIIT
 * Cardio's ride at 390, 768, 1024 and 1440 px with Class Start once it is left. The heap checks themselves run only
 * when a person asks; these are not they. Only `node tools/video-record/record.mjs docs/videos/19-3-heap-checks`.
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

test("the race with its world, and Race Setup once it is left, at XL", async ({ page, bluetooth, api, webgl }) => {
  await frame(page, "XL");
  await webgl.withoutWebGpu();
  const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=solo", { world: true });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  for (let i = 0; i < 20; i++) await page.clock.runFor(16);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await still(page, () => shot(page, "race-world-xl"));
  await race.end.click();
  await stepUntil(page, () => expect(new RaceSetupPage(page).title).toBeVisible({ timeout: 50 }));
  await expect(race.world).toHaveCount(0);
  await page.mouse.move(0, 0);
  await still(page, () => shot(page, "race-setup-xl"));
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`a class ride, and Class Start once it is left, at ${size}`, async ({ page, bluetooth, api }) => {
    await frame(page, size);
    const ride = await startClassRide(page, bluetooth, api);
    await page.clock.runFor(1000);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    await still(page, () => shot(page, `class-ride-${size.toLowerCase()}`));
    if (size !== "XL") return;
    await ride.leave.click();
    const start = new ClassStartPage(page);
    await stepUntil(page, () => expect(start.title).toBeVisible({ timeout: 50 }));
    await page.mouse.move(0, 0);
    await still(page, () => shot(page, "class-start-xl"));
  });
}

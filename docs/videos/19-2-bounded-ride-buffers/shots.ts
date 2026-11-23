import type { Page } from "@playwright/test";
import { startClassRide } from "../../../frontend/e2e/fixtures/class-ride";
import { enduranceClass } from "../../../frontend/e2e/fixtures/classes";
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ResultsPage } from "../../../frontend/e2e/pages/results.page";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 19.2, Bounded ride buffers, in the running app: a three-hour endurance class
 * at 0:01, then a minute from its end at 390, 768, 1024 and 1440 px, and Results once it finishes, its ride submitted
 * with 10,800 speed samples. The shared fixture's fake Bluetooth plays the bike and Playwright's clock moves the ride.
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/19-2-bounded-ride-buffers`.
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
  test(`a three-hour class a minute from its end, at ${size}`, async ({ page, bluetooth, api }) => {
    await frame(page, size);
    const ride = await startClassRide(page, bluetooth, api, { ride: enduranceClass });
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
    await page.clock.runFor(1000);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    if (size === "XL") {
      await expect(ride.clock).toHaveText("0:01 / 3:00:00");
      await still(page, () => shot(page, "class-start-xl"));
    }
    await page.clock.fastForward("02:58:59");
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
    await page.clock.runFor(100);
    await expect(ride.clock).toHaveText("2:59:00 / 3:00:00");
    await still(page, () => shot(page, `class-end-${size.toLowerCase()}`));
    if (size !== "XL") return;
    await page.clock.fastForward("01:00");
    await page.clock.runFor(2000);
    const results = new ResultsPage(page);
    await expect(results.heading).toBeVisible();
    await expect.poll(() => api.sentBodies("POST", "/api/rides")).toHaveLength(1);
    await still(page, () => shot(page, "results-xl"));
  });
}

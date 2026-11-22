import type { Page } from "@playwright/test";
import { RIDE_RECORDED } from "../../../frontend/e2e/fixtures/api";
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { openRace } from "../../../frontend/e2e/fixtures/live-race";
import { maps } from "../../../frontend/e2e/fixtures/maps";
import { midRiderProgress } from "../../../frontend/e2e/fixtures/progress";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ResultsPage } from "../../../frontend/e2e/pages/results.page";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 15.5, Record results nobody can change, in the running app: a riders-online race
 * on a 0.5 km Old Town Criterium ridden to the line, then Results while the service answers 409 result_pending
 * ("Recording your ride…") at 1440 px, and Results once the retry 5 seconds later is recorded, at 390, 768, 1024 and
 * 1440 px. The shared fixture's hub answers the race, its API fixture the maps, the progress and its answers to the
 * ride, and its fake Bluetooth the bike; Playwright's clock holds each moment. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/15-5-record-results-nobody-can-change`.
 */

const shortCriterium = maps.map((map) => (map.id === "old-town-criterium" ? { ...map, distanceKm: 0.5 } : map));

const RESULT_PENDING = () => ({
  status: 409,
  body: { status: 409, title: "The race's result is not recorded yet.", code: "result_pending" },
});

async function rideToTheLine(page: Page, bluetooth: FakeBluetooth) {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(32));
  for (let second = 0; second < 120 && !page.url().endsWith("/results"); second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(120));
    await page.clock.runFor(4000);
  }
}

/** Steps the paused clock by `step` ms until `shown` passes, for at most 30 seconds of real time. */
async function stepUntil(page: Page, shown: () => Promise<void>, step: number): Promise<void> {
  await expect(async () => {
    await page.clock.runFor(step);
    await shown();
  }).toPass({ timeout: 30_000 });
}

/** Steps the paused clock one frame per 50 ms of real time while a screenshot settles, as slice 15.1's film does. */
async function still(page: Page, take: () => Promise<void>): Promise<void> {
  let done = false;
  const taken = take().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
}

test.beforeEach(({ api }) => api.answer("GET", "/api/progress", midRiderProgress));

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Results of a riders-online race, recorded by the service, at ${size}`, async ({ page, bluetooth, hub, api }) => {
    await frame(page, size);
    api.answer("GET", "/api/maps", shortCriterium);
    api.answer("POST", "/api/rides", RESULT_PENDING);
    await openRace(page, hub, bluetooth, 4_500);
    await rideToTheLine(page, bluetooth);
    const results = new ResultsPage(page);
    await expect(page).toHaveURL("/results");
    await stepUntil(page, () => expect(results.xpNote).toHaveText("Recording your ride…", { timeout: 100 }), 16);
    await page.mouse.move(0, 0);
    if (size === "XL") await still(page, () => shot(page, "pending-xl"));
    api.answer("POST", "/api/rides", RIDE_RECORDED);
    await stepUntil(page, () => expect(results.xpTotal).toHaveText("+110", { timeout: 100 }), 1_000);
    await still(page, () => shot(page, `recorded-${size.toLowerCase()}`));
  });
}

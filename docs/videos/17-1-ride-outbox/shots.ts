import type { Page } from "@playwright/test";
import { RIDE_RECORDED } from "../../../frontend/e2e/fixtures/api";
import { openResults, soloRace } from "../../../frontend/e2e/fixtures/results";
import { ridesWaiting } from "../../../frontend/e2e/fixtures/rides-waiting";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ResultsPage } from "../../../frontend/e2e/pages/results.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 17.1, Ride outbox, in the running app: Results of a solo race on Old Town
 * Criterium that finished without a network, its XP pending and the ride kept on the device (at 390, 768, 1024 and
 * 1440 px), and the same Results once the network is back and the ride is recorded, with close-ups of the XP panel. The shared fixture's API answers no
 * ride while the network is down, then records it. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/17-1-ride-outbox`.
 */

/** Moves the pointer out of the picture. */
async function still(page: Page): Promise<void> {
  await page.mouse.move(0, 0);
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Results with the XP pending, at ${size}`, async ({ page, api }) => {
    await frame(page, size);
    const state = soloRace(1598);
    api.answer("POST", "/api/rides", () => ({ offline: true }));
    await openResults(page, state);
    await expect(new ResultsPage(page).xpNote).toHaveText("Your XP will be added when you’re back online.");
    await expect.poll(() => ridesWaiting(page)).toEqual([state.ride.rideId]);
    await still(page);
    await shot(page, `pending-${size.toLowerCase()}`);
    if (size === "XL") await detail(new ResultsPage(page).xp, "pending-xp", 24);
  });
}

test("Results once the ride is recorded, at XL", async ({ page, api }) => {
  await frame(page, "XL");
  const state = soloRace(1598);
  api.answer("POST", "/api/rides", () => ({ offline: true }));
  await openResults(page, state);
  const results = new ResultsPage(page);
  await expect(results.xpNote).toHaveText("Your XP will be added when you’re back online.");
  await expect.poll(() => ridesWaiting(page)).toEqual([state.ride.rideId]);
  api.answer("POST", "/api/rides", RIDE_RECORDED);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(results.xpTotal).toHaveText("+110");
  await expect.poll(() => ridesWaiting(page)).toEqual([]);
  await still(page);
  await shot(page, "recorded-xl");
  await detail(results.xp, "recorded-xp", 24);
});

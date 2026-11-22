import { RIDE_RECORDED } from "../../../frontend/e2e/fixtures/api";
import { openResults, soloRace } from "../../../frontend/e2e/fixtures/results";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ResultsPage } from "../../../frontend/e2e/pages/results.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 22.3, Limit abuse, in the running app, through the flow of
 * e2e/ride-outbox.spec.ts: Results for a ride the backend refused with 429 and a Retry-After of 50 minutes, its XP
 * waiting on the device, at 390, 768, 1024 and 1440 px; at 1440 px, close-ups of the XP waiting and, once the wait has
 * passed on the page's clock, of the XP added. The API fixture answers, so no backend ran. Not a test and not a sweep:
 * only `node tools/video-record/record.mjs docs/videos/22-3-limit-abuse`.
 */

const RATE_LIMITED = () => ({
  status: 429,
  headers: { "Retry-After": "3000" },
  body: { status: 429, title: "This can't be done right now.", code: "rate_limited" },
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`a ride refused with 429 waits on the device, at ${size}`, async ({ page, api }) => {
    await frame(page, size);
    await page.clock.install({ time: new Date("2026-11-22T08:00:00Z") });
    const state = soloRace(1598);
    api.answer("POST", "/api/rides", RATE_LIMITED);
    await openResults(page, { ...state, ride: { ...state.ride, finishedAt: "2026-11-22T07:30:00.000Z" } });
    const results = new ResultsPage(page);
    await expect(results.xpNote).toHaveText("Your XP will be added when you’re back online.");
    await page.clock.resume();
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `results-${size.toLowerCase()}`);
    if (size !== "XL") return;
    await detail(page.locator(".xp-earned"), "xp-waiting", 24);

    api.answer("POST", "/api/rides", RIDE_RECORDED);
    await page.clock.runFor(3_000_000);
    await expect(results.xpTotal).toHaveText("+110");
    await detail(page.locator(".xp-earned"), "xp-added", 24);
  });
}

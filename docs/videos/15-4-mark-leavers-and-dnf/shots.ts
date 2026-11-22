import type { Page } from "@playwright/test";
import { openRace, peersBoard, raceStandings, someoneLeftBoard } from "../../../frontend/e2e/fixtures/live-race";
import { midRiderProgress } from "../../../frontend/e2e/fixtures/progress";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 15.4, Mark leavers and DNF, in the running app: a riders-online race at 5:01
 * with the race mock's peers board, MarcoVelo 8th, at 1440 px; then the next second's standings, the race mock's
 * someone-left board, MarcoVelo marked DNF in last place, at 390, 768, 1024 and 1440 px. The shared fixture's hub
 * answers the connection, ServerTime (from the page's clock) and JoinRace and sends RaceStandingsUpdated, its API
 * fixture the progress, and its fake Bluetooth the bike; Playwright's clock holds each moment. Not a test and not a
 * sweep: only `node tools/video-record/record.mjs docs/videos/15-4-mark-leavers-and-dnf`.
 */

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
  test(`MarcoVelo marked DNF on the board, at ${size}`, async ({ page, bluetooth, hub }) => {
    await frame(page, size);
    const race = await openRace(page, hub, bluetooth, 301_500);
    await expect(race.clock).toHaveText(/^5:01/);
    if (size === "XL") {
      await hub.send("RaceStandingsUpdated", raceStandings(peersBoard));
      await page.clock.runFor(1_000);
      await expect(race.you).toHaveText(/^5You$/);
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(0, 0);
      await still(page, () => shot(page, "before-xl"));
    }
    await hub.send("RaceStandingsUpdated", raceStandings(someoneLeftBoard));
    await page.clock.runFor(1_000);
    if (size !== "XS") await expect(race.boardGaps.last()).toHaveText("DNF");
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    await still(page, () => shot(page, `dnf-${size.toLowerCase()}`));
  });
}

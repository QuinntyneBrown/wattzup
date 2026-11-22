import type { Page } from "@playwright/test";
import { openRace, peersBoard, raceStandings } from "../../../frontend/e2e/fixtures/live-race";
import { midRiderProgress } from "../../../frontend/e2e/fixtures/progress";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { RacePage } from "../../../frontend/e2e/pages/race.page";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 15.3, Live standings, in the running app: a riders-online race at 5:01 whose
 * board is the race mock's peers board as the service sends it, the rider 5th of 10, at 390, 768, 1024 and 1440 px;
 * then, at 1440 px, the next second's standings with the rider past Pacer Atlas into 4th. The shared fixture's hub
 * answers the connection, ServerTime (from the page's clock) and JoinRace and sends RaceStandingsUpdated, its API
 * fixture the progress, and its fake Bluetooth the bike; Playwright's clock holds each moment. Not a test and not a
 * sweep: only `node tools/video-record/record.mjs docs/videos/15-3-live-standings`.
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

/** The peers board with the rider past Pacer Atlas, half a second ahead of it. */
const passed = (() => {
  const lines = peersBoard.map((line) => (line.seat === 6 ? { ...line, metres: 2_112, gapSeconds: 4.5 } : line));
  return [lines[0]!, lines[1]!, lines[2]!, lines[4]!, lines[3]!, ...lines.slice(5)];
})();

test.beforeEach(({ api }) => api.answer("GET", "/api/progress", midRiderProgress));

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the race's board as the service sends it, at ${size}`, async ({ page, bluetooth, hub }) => {
    await frame(page, size);
    const race: RacePage = await openRace(page, hub, bluetooth, 301_500);
    await expect(race.clock).toHaveText(/^5:01/);
    await hub.send("RaceStandingsUpdated", raceStandings(peersBoard));
    await page.clock.runFor(1_000);
    if (size !== "XS") await expect(race.you).toHaveText(/^5You$/);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    await still(page, () => shot(page, `board-${size.toLowerCase()}`));
    if (size !== "XL") return;
    await hub.send("RaceStandingsUpdated", raceStandings(passed));
    await page.clock.runFor(1_000);
    await expect(race.you).toHaveText(/^4You$/);
    await still(page, () => shot(page, "passed-xl"));
  });
}

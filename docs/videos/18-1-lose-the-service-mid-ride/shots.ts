import type { Page } from "@playwright/test";
import { boardAtSeven, hiitCardio, hiitSession, seated, SESSIONS_NOW, standings } from "../../../frontend/e2e/fixtures/classes";
import { ECHELON_NOTIFY, echelonBike, resistanceFrame } from "../../../frontend/e2e/fixtures/echelon";
import { openRace, peersBoard, raceStandings } from "../../../frontend/e2e/fixtures/live-race";
import { midRiderProgress } from "../../../frontend/e2e/fixtures/progress";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 18.1, Lose the service mid-ride, in the running app: a riders-online race at
 * 5:01 with the race mock's peers board, the rider 5th of 10; then the service lost, the race on at 5:04 with the last
 * standings and the notice under the board's title, at 390, 768, 1024 and 1440 px; then, at 1440 px, the service back,
 * the race rejoined and the standings it sends with the rider past Pacer Atlas into 4th. Then a group class at 7:00 with
 * its output board, losing the service the same way. The shared fixture's hub answers the connection, ServerTime and the
 * joins, refuses every reconnect while lost, and sends the standings; Playwright's clock holds each moment. Not a test
 * and not a sweep: only `node tools/video-record/record.mjs docs/videos/18-1-lose-the-service-mid-ride`.
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

/** The peers board with the rider past Pacer Atlas, half a second ahead of it. */
const passed = (() => {
  const lines = peersBoard.map((line) => (line.seat === 6 ? { ...line, metres: 2_112, gapSeconds: 4.5 } : line));
  return [lines[0]!, lines[1]!, lines[2]!, lines[4]!, lines[3]!, ...lines.slice(5)];
})();

const NOTICE = "Reconnecting. The standings will catch up.";

test.beforeEach(({ api }) => api.answer("GET", "/api/progress", midRiderProgress));

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`a riders-online race through a lost service, at ${size}`, async ({ page, bluetooth, hub }) => {
    await frame(page, size);
    const race = await openRace(page, hub, bluetooth, 301_500);
    await hub.send("RaceStandingsUpdated", raceStandings(peersBoard));
    await page.clock.runFor(1_000);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    if (size === "XL") {
      await expect(race.you).toHaveText(/^5You$/);
      await still(page, () => shot(page, "before-xl"));
    }
    await hub.lose();
    await page.clock.runFor(3_000);
    await expect(race.clock).toHaveText(/^5:05/);
    if (size !== "XS") await expect(race.boardNotice).toHaveText(NOTICE);
    await still(page, () => shot(page, `lost-${size.toLowerCase()}`));
    if (size !== "XL") return;
    await still(page, () => detail(race.board, "board-lost", 24));
    hub.restore();
    await page.clock.runFor(10_000);
    await expect.poll(() => hub.invocations("JoinRace").length).toBe(2);
    await hub.send("RaceStandingsUpdated", raceStandings(passed));
    await page.clock.runFor(1_000);
    await expect(race.boardNotice).toBeEmpty();
    await expect(race.you).toHaveText(/^4You$/);
    await still(page, () => shot(page, "back-xl"));
    await still(page, () => detail(race.board, "board-back", 24));
  });
}

test("a group class through a lost service, at XL", async ({ page, bluetooth, hub, webgl }) => {
  const session = hiitSession("2026-11-21T19:29:00Z", []);
  await frame(page, "XL");
  await page.clock.install({ time: SESSIONS_NOW - 10_000 });
  await webgl.disable();
  await bluetooth.remember(echelonBike);
  hub.open();
  hub.answer("ServerTime", () => page.evaluate(() => Date.now()));
  hub.answer("JoinClassSession", () => seated(session));
  const ride = new ClassRidePage(page);
  await ride.openGroup(hiitCardio.id, session.id);
  await expect(ride.clock).not.toHaveText(/^0:00/);
  await page.clock.pauseAt(SESSIONS_NOW - 500);
  await page.clock.runFor(1_000);
  // The bike reports its resistance, so its link is up through the lost service.
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  await hub.send("StandingsUpdated", standings(session, boardAtSeven));
  await page.clock.runFor(100);
  await expect(ride.boardPlace).toHaveText("5th / 9");
  await hub.lose();
  await page.clock.runFor(3_000);
  await expect(ride.boardNotice).toHaveText(NOTICE);
  await expect(ride.lost).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await still(page, () => shot(page, "class-lost-xl"));
  await still(page, () => detail(ride.board, "class-board-lost", 24));
});

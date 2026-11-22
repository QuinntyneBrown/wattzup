import type { Page } from "@playwright/test";
import {
  boardAtSeven,
  catalogue,
  hiitCardio,
  hiitSession,
  seated,
  SESSIONS_NOW,
  standings,
} from "../../../frontend/e2e/fixtures/classes";
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 14.5, Live group board, in the running app: the group ride at 7:00 with the
 * output board the hub sent (the Class Ride mock's nine riders, the rider fifth), at 390, 768, 1024 and 1440 px; the
 * board close up; and the board after the next standings put the rider second. The shared fixture's hub answers the
 * connection, ServerTime (from the page's clock) and JoinClassSession and sends StandingsUpdated, its API fixture the
 * class, its fake Bluetooth the bike and its YouTube fixture the class video; Playwright's clock moves the ride. Not a
 * test and not a sweep: only `node tools/video-record/record.mjs docs/videos/14-5-live-group-board`.
 */

/** A session that started seven minutes before SESSIONS_NOW, so the ride stands at 7:00 as the mock does. */
const session = hiitSession("2026-11-21T19:23:00Z", []);

/** Steps the paused clock one frame per 50 ms of real time while a screenshot settles, as slice 14.1's film does. */
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
  test(`the group ride with its board at 7:00, at ${size}`, async ({ page, bluetooth, api, hub }) => {
    await frame(page, size);
    api.answer("GET", "/api/classes", catalogue);
    hub.open();
    hub.answer("ServerTime", () => page.evaluate(() => Date.now()));
    hub.answer("JoinClassSession", () => seated(session));
    await page.clock.install({ time: SESSIONS_NOW - 10_000 });
    await bluetooth.remember(echelonBike);
    const ride = new ClassRidePage(page);
    await ride.openGroup(hiitCardio.id, session.id);
    await expect(ride.clock).not.toHaveText(/^0:00/);
    await page.clock.pauseAt(SESSIONS_NOW - 500);
    await page.clock.runFor(1_000);
    await expect(ride.clock).toHaveText(/^7:00/);
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(73));
    await hub.send("StandingsUpdated", standings(session, boardAtSeven));
    await page.clock.runFor(100);
    await expect(ride.boardPlace).toHaveText("5th / 9");
    await page.evaluate(() => document.fonts.ready);
    await expect(ride.cover).toHaveJSProperty("complete", true);
    await page.mouse.move(0, 0);
    await still(page, () => shot(page, `board-${size.toLowerCase()}`));
    if (size !== "XL") return;
    await still(page, () => detail(ride.board, "board-detail", 16));
    const later = boardAtSeven.map(([name, jersey, kj]) => [name, jersey, name === "lena.k" ? 70.0 : kj + 0.6] as const);
    await hub.send("StandingsUpdated", standings(session, later));
    await page.clock.runFor(1_000);
    await expect(ride.boardPlace).toHaveText("2nd / 9");
    await still(page, () => detail(ride.board, "board-reordered", 16));
  });
}

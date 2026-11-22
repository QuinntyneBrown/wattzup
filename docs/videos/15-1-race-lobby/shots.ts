import type { Page } from "@playwright/test";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { midRiderProgress } from "../../../frontend/e2e/fixtures/progress";
import { bot, found, lobbyOfSix, open, seatsChanged, withSeat } from "../../../frontend/e2e/fixtures/race-lobby";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { RaceLobbyPage } from "../../../frontend/e2e/pages/race-lobby.page";
import { RaceSetupPage } from "../../../frontend/e2e/pages/race-setup.page";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 15.1, Race lobby, in the running app: Race Setup with Riders online chosen and
 * the riders queuing; the riders-online lobby waiting for riders at 0:24 (the Race Lobby mock's five riders and the
 * rider) at 390, 768, 1024 and 1440 px; the lobby after MarcoVelo leaves; and the lobby full after the bot fill. The
 * shared fixture's hub answers the connection, ServerTime (from the page's clock) and FindRace and sends SeatsChanged,
 * its API fixture the progress and the queue, and its fake Bluetooth the bike; Playwright's clock holds the countdown.
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/15-1-race-lobby`.
 */

const NOW = new Date("2026-11-22T18:00:00Z").getTime();

/** Steps the paused clock one frame per 50 ms of real time while a screenshot settles, as slice 14.5's film does. */
async function still(page: Page, take: () => Promise<void>): Promise<void> {
  let done = false;
  const taken = take().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
}

test.beforeEach(({ api }) => {
  api.answer("GET", "/api/progress", midRiderProgress);
  api.answer("GET", "/api/maps/old-town-criterium/queue", { riders: 5 });
});

test("Race Setup with Riders online and the riders queuing, at XL", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await bluetooth.remember(echelonBike);
  const setup = new RaceSetupPage(page);
  await setup.open("old-town-criterium");
  await setup.mode("Riders online").click();
  await expect(setup.start).toHaveText("Find a race");
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await shot(page, "setup-xl");
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the riders-online lobby waiting for riders, at ${size}`, async ({ page, bluetooth, hub }) => {
    await frame(page, size);
    hub.open();
    hub.answer("ServerTime", () => page.evaluate(() => Date.now()));
    hub.answer("FindRace", async () => found((await page.evaluate(() => Date.now())) + 23_500, 6, lobbyOfSix));
    await page.clock.install({ time: NOW });
    await bluetooth.remember(echelonBike);
    const lobby = new RaceLobbyPage(page);
    await lobby.open("old-town-criterium", "mode=online");
    await expect(lobby.count).toHaveText("6 / 10");
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
    await page.clock.runFor(100);
    await expect(lobby.clock).toHaveText("0:24");
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    await still(page, () => shot(page, `lobby-${size.toLowerCase()}`));
    if (size !== "XL") return;

    await hub.send("SeatsChanged", seatsChanged(withSeat(lobbyOfSix, open(2)), "MarcoVelo"));
    await page.clock.runFor(2_000);
    await expect(lobby.notice).toHaveText("MarcoVelo left. Their seat is open again.");
    await still(page, () => shot(page, "left-xl"));

    // The screenshots stepped the clock, so run it to 0:10 a second at a time.
    while ((await lobby.clock.textContent())?.trim() !== "0:10") await page.clock.runFor(1_000);
    const names = ["Nova", "Rook", "Juno", "Atlas", "Kite"];
    const full = withSeat(lobbyOfSix, open(2)).map((seat) => (seat.kind === "open" ? bot(seat.number, names.shift() ?? "") : seat));
    await hub.send("SeatsChanged", seatsChanged(full));
    await page.clock.runFor(100);
    await expect(lobby.status).toHaveText("On the start line");
    await lobby.ready.click();
    await page.clock.runFor(100);
    await still(page, () => shot(page, "full-xl"));
  });
}

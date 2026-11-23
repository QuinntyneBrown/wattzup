import type { Page } from "@playwright/test";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { midRiderProgress } from "../../../frontend/e2e/fixtures/progress";
import { RACE_SESSION, bot, found, lobbyOfSix } from "../../../frontend/e2e/fixtures/race-lobby";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { FakeWebGl } from "../../../frontend/e2e/fixtures/webgl";
import { RaceLobbyPage } from "../../../frontend/e2e/pages/race-lobby.page";
import { RacePage } from "../../../frontend/e2e/pages/race.page";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 15.2, Start a live race, in the running app: the riders-online lobby, full after
 * the bot fill, with the countdown at 3 at 390, 768, 1024 and 1440 px, then at 1 (Go opens the race in the same moment); and the race in its session, opened
 * four and a half seconds after the start, its clock already at 0:04. The shared fixture's hub answers the connection,
 * ServerTime (from the page's clock), FindRace and JoinRace, its API fixture the progress, and its fake Bluetooth the
 * bike; Playwright's clock holds each moment. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/15-2-start-a-live-race`.
 */

const NOW = new Date("2026-11-22T18:00:00Z").getTime();
const full = lobbyOfSix.map((seat, i) => (seat.kind === "open" ? bot(seat.number, ["Nova", "Rook", "Juno", "Atlas"][i - 6]) : seat));

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
  test(`the lobby's countdown at 3, at ${size}`, async ({ page, bluetooth, hub }) => {
    await frame(page, size);
    hub.open();
    hub.answer("ServerTime", () => page.evaluate(() => Date.now()));
    hub.answer("FindRace", async () => found((await page.evaluate(() => Date.now())) + 5_500, 6, full));
    // At Go the race opens and joins its session again.
    hub.answer("JoinRace", async () => found(await page.evaluate(() => Date.now()), 6, full));
    await new FakeWebGl(page).disable();
    await page.clock.install({ time: NOW });
    await bluetooth.remember(echelonBike);
    const lobby = new RaceLobbyPage(page);
    await lobby.open("old-town-criterium", "mode=online");
    await expect(lobby.count).toHaveText("10 / 10");
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
    await page.clock.runFor(100);
    while ((await lobby.countdownStep.count()) === 0) await page.clock.runFor(1_000);
    await expect(lobby.countdownStep).toHaveText("3");
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    await still(page, () => shot(page, `countdown-${size.toLowerCase()}`));
    if (size !== "XL") return;
    // Go opens the race in the same moment, so the last step filmed is 1.
    while ((await lobby.countdownStep.textContent())?.trim() !== "1") await page.clock.runFor(1_000);
    await still(page, () => shot(page, "one-xl"));
  });
}

test("the race in its session, opened 4.5 seconds after the start, at XL", async ({ page, bluetooth, hub }) => {
  await frame(page, "XL");
  await new FakeWebGl(page).disable();
  hub.open();
  hub.answer("ServerTime", () => page.evaluate(() => Date.now()));
  hub.answer("JoinRace", async () => found((await page.evaluate(() => Date.now())) - 4_500, 6, full));
  await page.clock.install({ time: NOW + 30_000 });
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open("old-town-criterium", `mode=online&session=${RACE_SESSION}`);
  await expect.poll(() => hub.invocations("JoinRace").length).toBe(1);
  await expect(race.route).toHaveText("Cathedral Circuit · Live race");
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
  await page.clock.runFor(100);
  await expect(race.clock).toHaveText(/^0:04/);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await still(page, () => shot(page, "race-xl"));
});

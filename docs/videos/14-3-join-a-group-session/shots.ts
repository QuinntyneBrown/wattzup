import type { Page } from "@playwright/test";
import { RIDE_START } from "../../../frontend/e2e/fixtures/class-ride";
import {
  catalogue,
  hiitCardio,
  hiitSession,
  hiitSessions,
  refused,
  seated,
  SESSIONS_NOW,
  sixRiders,
} from "../../../frontend/e2e/fixtures/classes";
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  echelonBike,
  resistanceFrame,
  targetResistanceWrite,
  workoutFrame,
} from "../../../frontend/e2e/fixtures/echelon";
import { library } from "../../../frontend/e2e/fixtures/library";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { ClassStartPage } from "../../../frontend/e2e/pages/class-start.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 14.3, Join a group session, in the running app: Class Start offering the 7:39 PM
 * session before Join; the group ride after the hub gave the seat, at 7:00, at 390, 768, 1024 and 1440 px; and Class
 * Start after the hub refused a full session and a started one, offering the next. The shared fixture's hub answers
 * the connection, ServerTime and JoinClassSession, its API fixture the sessions, its fake Bluetooth the bike and its
 * YouTube fixture the class video; Playwright's clock moves the ride. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/14-3-join-a-group-session`.
 */

const SESSIONS = `/api/classes/${hiitCardio.id}/sessions`;
const choice = (page: Page) => page.locator("wz-ride-choice");

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

test("Class Start before Join, at XL", async ({ page, api }) => {
  api.answer("GET", "/api/classes", library);
  api.answer("GET", SESSIONS, hiitSessions);
  await frame(page, "XL");
  await page.clock.install({ time: SESSIONS_NOW });
  const start = new ClassStartPage(page);
  await start.open(hiitCardio.id);
  await expect(start.join).toHaveText("Join · starts in 9 min");
  await page.evaluate(() => document.fonts.ready);
  await pictures(page);
  await page.mouse.move(0, 0);
  await shot(page, "start-xl");
  await detail(choice(page), "join-choice", 16);
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the group ride with its seat, at 7:00 at ${size}`, async ({ page, bluetooth, api, hub, youtube }) => {
    await frame(page, size);
    hub.open();
    hub.answer("ServerTime", () => RIDE_START + 61_500);
    hub.answer("JoinClassSession", () => seated(hiitSessions[0]));
    let answer: (body: unknown) => void = () => undefined;
    const held = new Promise((resolve) => (answer = resolve));
    api.answer("GET", "/api/classes", async () => ({ body: await held }));
    await page.clock.install({ time: RIDE_START });
    await bluetooth.remember(echelonBike);
    const ride = new ClassRidePage(page);
    await ride.openGroup(hiitCardio.id, hiitSessions[0].id);
    await expect.poll(() => bluetooth.log()).toEqual(ECHELON_INITIALISED);
    // The ride connects, measures the clock and takes its seat before the clock is paused (L143).
    await expect.poll(() => hub.invocations("JoinClassSession").length).toBe(1);
    await page.clock.pauseAt(RIDE_START + 60_000);
    answer(catalogue);
    await expect.poll(() => bluetooth.writes().map((write) => write.hex)).toContain(targetResistanceWrite(8));
    await page.clock.runFor(100);
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    await page.clock.runFor(100);
    await page.clock.fastForward("07:00");
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(73));
    await page.clock.runFor(100);
    await expect(ride.powerHint).toHaveText("On target");
    await page.evaluate(() => document.fonts.ready);
    await expect(ride.cover).toHaveJSProperty("complete", true);
    await page.mouse.move(0, 0);
    await still(page, () => shot(page, `group-${size.toLowerCase()}`));
  });
}

for (const refusal of ["full", "started"] as const) {
  test(`Class Start after a ${refusal} session, at XL`, async ({ page, api, bluetooth, hub }) => {
    const full = hiitSession("2026-11-21T19:39:00Z", sixRiders, true);
    const started = hiitSession("2026-11-21T19:24:00Z", sixRiders);
    api.answer("GET", "/api/classes", library);
    api.answer("GET", SESSIONS, refusal === "full" ? [full, hiitSessions[1]] : hiitSessions);
    await frame(page, "XL");
    await page.clock.install({ time: SESSIONS_NOW });
    await bluetooth.remember(echelonBike);
    hub.open();
    hub.answer("ServerTime", () => Date.now());
    hub.answer("JoinClassSession", () =>
      refusal === "full"
        ? refused("session_full", full, hiitSessions[1])
        : refused("session_started", started, hiitSessions[0]),
    );
    await new ClassRidePage(page).openGroup(hiitCardio.id, refusal === "full" ? full.id : started.id);
    const start = new ClassStartPage(page);
    await expect(page).toHaveURL(`/classes/${hiitCardio.id}`);
    await expect(start.join).toHaveText(refusal === "full" ? "Join the next session" : "Join · starts in 9 min");
    await page.evaluate(() => document.fonts.ready);
    await pictures(page);
    await page.mouse.move(0, 0);
    await detail(choice(page), `${refusal}-choice`, 16);
  });
}

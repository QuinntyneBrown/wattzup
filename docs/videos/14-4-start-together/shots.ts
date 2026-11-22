import type { Page } from "@playwright/test";
import { catalogue, hiitCardio, hiitSession, seated, SESSIONS_NOW } from "../../../frontend/e2e/fixtures/classes";
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  echelonBike,
  resistanceFrame,
  workoutFrame,
} from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 14.4, Start together, in the running app: the group ride waiting for its 7:39 PM
 * session, the clock at 0:00 and the video parked under "Starts in 9:00", at 390, 768, 1024 and 1440 px; the ride five
 * seconds after its session started; and a rider who arrived two minutes after the start. The shared fixture's hub
 * answers the connection, ServerTime (from the page's clock) and JoinClassSession, its API fixture the class, its fake
 * Bluetooth the bike and its YouTube fixture the class video; Playwright's clock moves the ride. Not a test and not a
 * sweep: only `node tools/video-record/record.mjs docs/videos/14-4-start-together`.
 */

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

type Fixtures = Parameters<Parameters<typeof test>[2]>[0];

/**
 * Opens the group ride in a session starting at `startsAt` and, once it has its seat, stands the clock half a second
 * past SESSIONS_NOW, as group-class-start.spec.ts does.
 */
async function seatedRide(
  { page, bluetooth, api, hub }: Fixtures,
  size: Size,
  startsAt: string,
): Promise<ClassRidePage> {
  const session = hiitSession(startsAt, []);
  await frame(page, size);
  api.answer("GET", "/api/classes", catalogue);
  hub.open();
  hub.answer("ServerTime", () => page.evaluate(() => Date.now()));
  hub.answer("JoinClassSession", () => seated(session));
  await page.clock.install({ time: SESSIONS_NOW - 10_000 });
  await bluetooth.remember(echelonBike);
  const ride = new ClassRidePage(page);
  await ride.openGroup(hiitCardio.id, session.id);
  // The bike has had its handshake; a rider who arrives late is sent the first target resistance alongside it.
  await expect.poll(async () => (await bluetooth.log()).length).toBeGreaterThanOrEqual(ECHELON_INITIALISED.length);
  await expect(ride.wait.or(ride.clock.filter({ hasNotText: /^0:00/ }))).toBeVisible();
  await page.clock.pauseAt(SESSIONS_NOW - 500);
  await page.clock.runFor(1_000);
  return ride;
}

/** The bike at `level` and `cadence`, the fonts and the cover loaded, the pointer out of the way. */
async function settle({ page, bluetooth }: Fixtures, ride: ClassRidePage, level: number, cadence: number): Promise<void> {
  await page.clock.runFor(100);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(level));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(cadence));
  await page.clock.runFor(100);
  await page.evaluate(() => document.fonts.ready);
  await expect(ride.cover).toHaveJSProperty("complete", true);
  await page.mouse.move(0, 0);
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the group ride waiting for its start, at ${size}`, async ({ page, bluetooth, api, hub }) => {
    const fixtures = { page, bluetooth, api, hub } as Fixtures;
    const ride = await seatedRide(fixtures, size, "2026-11-21T19:39:00Z");
    await expect(ride.waitTime).toHaveText("9:00");
    await settle(fixtures, ride, 8, 64);
    await still(page, () => shot(page, `wait-${size.toLowerCase()}`));
    if (size === "XL") await still(page, () => detail(page.locator(".class-video"), "wait-video", 16));
  });
}

test("the group ride five seconds after its start, at XL", async ({ page, bluetooth, api, hub }) => {
  const fixtures = { page, bluetooth, api, hub } as Fixtures;
  const ride = await seatedRide(fixtures, "XL", "2026-11-21T19:30:30Z");
  await expect(ride.waitTime).toHaveText("0:30");
  await page.clock.runFor(35_000);
  await expect(ride.wait).toHaveCount(0);
  await expect(ride.clock).toHaveText(/^0:05/);
  await settle(fixtures, ride, 8, 80);
  await still(page, () => shot(page, "started-xl"));
});

test("a rider who arrives two minutes after the start, at XL", async ({ page, bluetooth, api, hub }) => {
  const fixtures = { page, bluetooth, api, hub } as Fixtures;
  const ride = await seatedRide(fixtures, "XL", "2026-11-21T19:28:00Z");
  await expect(ride.clock).toHaveText(/^2:00/);
  await settle(fixtures, ride, 8, 80);
  await still(page, () => shot(page, "late-xl"));
});

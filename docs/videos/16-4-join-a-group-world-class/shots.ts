import type { Locator, Page } from "@playwright/test";
import { connectBike } from "../../../frontend/e2e/fixtures/class-ride";
import { catalogue, hiitCardio, hiitSession, hiitSessions, seated, SESSIONS_NOW } from "../../../frontend/e2e/fixtures/classes";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { WorldAssets } from "../../../frontend/e2e/fixtures/world-assets";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { WorldLoadingPage } from "../../../frontend/e2e/pages/world-loading.page";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 16.4, Join a group world class, in the running app: World loading for
 * 30 Minute HIIT Cardio's 7:39 PM session counting down while Old Town Criterium builds (at 390, 768, 1024 and
 * 1440 px), the class ride starting with the group on the panorama while the world still loads, the world faded in
 * once ready, and the class ride starting with the lost-bike alert when the bike is missing at the start. The shared
 * fixture's API answers the catalogue and the sessions, its hub the seat and the server's time, its fake Bluetooth the
 * bike, and the world-assets fixture the world's download; Playwright's clock runs from 19:29:50 and jumps to the
 * start. Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/16-4-join-a-group-world-class`.
 */

let assets: WorldAssets;
let loading: WorldLoadingPage;
let ride: ClassRidePage;

/** Waits for an image to be drawn, and moves the pointer out of the picture. */
async function drawn(page: Page, image: Locator): Promise<void> {
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.mouse.move(0, 0);
}

test.beforeEach(async ({ page, api, bluetooth, hub }) => {
  await page.clock.install({ time: SESSIONS_NOW - 10_000 });
  api.answer("GET", "/api/classes", catalogue);
  api.answer("GET", `/api/classes/${hiitCardio.id}/sessions`, hiitSessions);
  await bluetooth.remember(echelonBike);
  hub.open();
  hub.answer("ServerTime", () => page.evaluate(() => Date.now()));
  assets = await WorldAssets.install(page);
  loading = new WorldLoadingPage(page);
  ride = new ClassRidePage(page);
});

test.afterEach(() => assets.dispose());

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`World loading counting down to the group, at ${size}`, async ({ page, bluetooth, hub }) => {
    await frame(page, size);
    hub.answer("JoinClassSession", () => seated(hiitSessions[0]));
    assets.hold();
    await ride.openGroup(hiitCardio.id, hiitSessions[0].id);
    await connectBike(bluetooth);
    await expect(loading.groupTimer).toBeVisible();
    await drawn(page, loading.panorama);
    await shot(page, `countdown-${size.toLowerCase()}`);
  });
}

test("The group starts on the panorama, then the world fades in, at XL", async ({ page, bluetooth, hub }) => {
  await frame(page, "XL");
  const session = hiitSession("2026-11-21T19:30:30Z", []);
  hub.answer("JoinClassSession", () => seated(session));
  assets.hold();
  await ride.openGroup(hiitCardio.id, session.id);
  await connectBike(bluetooth);
  await expect(loading.groupTimer).toBeVisible();
  await page.clock.fastForward(40_000);
  await expect(ride.name).toHaveText("30 Minute HIIT Cardio · Group");
  await drawn(page, ride.worldPanorama);
  await shot(page, "started-xl");
  await assets.release();
  await expect(ride.worldScene).toHaveCSS("opacity", "1", { timeout: 60_000 });
  await page.mouse.move(0, 0);
  await shot(page, "faded-xl");
});

test("No bike at the start, at XL", async ({ page, bluetooth, hub, webgl }) => {
  await frame(page, "XL");
  await webgl.disable();
  await bluetooth.switchOff();
  const session = hiitSession("2026-11-21T19:30:30Z", []);
  hub.answer("JoinClassSession", () => seated(session));
  await ride.openGroup(hiitCardio.id, session.id);
  await expect(loading.groupTimer).toBeVisible();
  await drawn(page, loading.panorama);
  await shot(page, "nobike-xl");
  await page.clock.fastForward(40_000);
  await expect(ride.lost).toBeVisible();
  await drawn(page, ride.worldPanorama);
  await shot(page, "lost-xl");
});

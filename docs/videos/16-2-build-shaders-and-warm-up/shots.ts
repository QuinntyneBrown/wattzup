import type { Page } from "@playwright/test";
import { catalogue, hiitCardio } from "../../../frontend/e2e/fixtures/classes";
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  echelonBike,
  resistanceFrame,
} from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { WorldAssets } from "../../../frontend/e2e/fixtures/world-assets";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { WorldLoadingPage } from "../../../frontend/e2e/pages/world-loading.page";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 16.2, Build shaders and warm up, in the running app: World loading for
 * 30 Minute HIIT Cardio over Old Town Criterium while its programs build in batches, ready with the frame rate the
 * warm-up held, and after 20 seconds without the world (at 390, 768, 1024 and 1440 px), then the class ride after Ride
 * with the panorama. The shared fixture's API answers the catalogue, its fake Bluetooth the bike, and the world-assets
 * fixture the panorama's download; Playwright's clock jumps the 20 seconds. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/16-2-build-shaders-and-warm-up`.
 */

let assets: WorldAssets;
let loading: WorldLoadingPage;

/** The remembered Echelon, connected once it answers its initialisation. */
async function connect(bluetooth: FakeBluetooth): Promise<void> {
  await expect.poll(() => bluetooth.log()).toEqual(ECHELON_INITIALISED);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  await expect(loading.facts.first()).toHaveText("Echelon EX-5s");
}

/** Waits for the panorama behind the card to be drawn. */
async function panoramaShown(page: Page): Promise<void> {
  await expect.poll(() => loading.panorama.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.mouse.move(0, 0);
}

test.beforeEach(async ({ page, api, bluetooth }) => {
  api.answer("GET", "/api/classes", catalogue);
  await bluetooth.remember(echelonBike);
  assets = await WorldAssets.install(page);
  loading = new WorldLoadingPage(page);
});

test.afterEach(() => assets.dispose());

test("World loading, building and ready, at XL", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  assets.hold();
  await new ClassRidePage(page).open(hiitCardio.id);
  await connect(bluetooth);
  await panoramaShown(page);
  await assets.release();
  // The programs counted part way: three yields to each frame as it builds them.
  await expect(loading.step(1).detail).toHaveText(/^\d+ of \d+ programs for/, { timeout: 30_000 });
  await shot(page, "building-xl");
  await expect(loading.cardTitle).toHaveText("Old Town Criterium is ready", { timeout: 30_000 });
  await expect(loading.start).toBeFocused();
  await shot(page, "ready-xl");
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`World loading, slow, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await page.clock.install();
    assets.hold();
    await new ClassRidePage(page).open(hiitCardio.id);
    await connect(bluetooth);
    await panoramaShown(page);
    await page.clock.fastForward(20_000);
    await expect(loading.warning).toBeVisible();
    await page.mouse.move(0, 0);
    await shot(page, `slow-${size.toLowerCase()}`);
    if (size === "XL") {
      await loading.panoramaRide.click();
      await expect(new ClassRidePage(page).name).toHaveText("30 Minute HIIT Cardio · Solo");
      await page.mouse.move(0, 0);
      await shot(page, "ride-xl");
    }
  });
}

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
import { OLDTOWN_PANORAMA, WorldAssets } from "../../../frontend/e2e/fixtures/world-assets";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { WorldLoadingPage } from "../../../frontend/e2e/pages/world-loading.page";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 16.1, Download the world, in the running app: World loading for 30 Minute HIIT
 * Cardio over Old Town Criterium's panorama while its download is held, ready once `main`'s renderer has built the
 * world (at 390, 768, 1024 and 1440 px), stopped part way, ready as a panorama without 3D, and the class ride after
 * Start riding. The shared fixture's API answers the catalogue, its fake Bluetooth the bike, and the world-assets
 * fixture the panorama's download. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/16-1-download-the-world`.
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

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`World loading, ready, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    if (size === "XL") assets.hold();
    await new ClassRidePage(page).open(hiitCardio.id);
    await connect(bluetooth);
    if (size === "XL") {
      await expect(loading.step(0).root).toHaveAttribute("aria-current", "step");
      await panoramaShown(page);
      await shot(page, "downloading-xl");
      await assets.release();
    }
    await expect(loading.cardTitle).toHaveText("Old Town Criterium is ready", { timeout: 30_000 });
    await expect(loading.start).toBeFocused();
    await panoramaShown(page);
    await shot(page, `ready-${size.toLowerCase()}`);
    if (size === "XL") {
      await loading.start.click();
      await expect(new ClassRidePage(page).name).toHaveText("30 Minute HIIT Cardio · Solo");
      await page.mouse.move(0, 0);
      await shot(page, "ride-xl");
    }
  });
}

test("World loading, stopped part way, at XL", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  assets.stopAfter(Math.floor(OLDTOWN_PANORAMA.length / 2));
  await new ClassRidePage(page).open(hiitCardio.id);
  await connect(bluetooth);
  await expect(loading.cardTitle).toHaveText("Couldn’t load Old Town Criterium");
  await panoramaShown(page);
  await shot(page, "stopped-xl");
});

test("World loading, ready as a panorama without 3D, at XL", async ({ page, bluetooth, webgl }) => {
  await webgl.disable();
  await frame(page, "XL");
  await new ClassRidePage(page).open(hiitCardio.id);
  await connect(bluetooth);
  await expect(loading.cardTitle).toHaveText("Old Town Criterium is ready as a panorama");
  await panoramaShown(page);
  await shot(page, "panorama-xl");
});

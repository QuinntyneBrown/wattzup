import type { Page } from "@playwright/test";
import { connectBike } from "../../../frontend/e2e/fixtures/class-ride";
import { catalogue, hiitCardio } from "../../../frontend/e2e/fixtures/classes";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { WorldAssets } from "../../../frontend/e2e/fixtures/world-assets";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { WorldLoadingPage } from "../../../frontend/e2e/pages/world-loading.page";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 16.3, Start a solo world class, in the running app: World loading for
 * 30 Minute HIIT Cardio over Old Town Criterium with the world ready and no bike, then ready with the bike connected,
 * then the class ride in its world, faded in, with the video in the corner (at 390, 768, 1024 and 1440 px), and the
 * class ride on the panorama when the video cannot play. The shared fixture's API answers the catalogue, its fake
 * Bluetooth the bike, its fake YouTube the video, and the world-assets fixture the world's download. Not a test and not
 * a sweep: only `node tools/video-record/record.mjs docs/videos/16-3-start-a-solo-world-class`.
 */

let assets: WorldAssets;
let loading: WorldLoadingPage;
let ride: ClassRidePage;

/** Waits for the panorama behind the card to be drawn. */
async function panoramaShown(page: Page): Promise<void> {
  await expect.poll(() => loading.panorama.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.mouse.move(0, 0);
}

/** Waits for the world to have faded in on the class ride's stage. */
async function worldShown(page: Page): Promise<void> {
  await expect(ride.name).toHaveText("30 Minute HIIT Cardio · Solo");
  await expect(ride.worldScene).toHaveCSS("opacity", "1", { timeout: 30_000 });
  await expect.poll(() => ride.worldPanorama.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.mouse.move(0, 0);
}

test.beforeEach(async ({ page, api, bluetooth }) => {
  api.answer("GET", "/api/classes", catalogue);
  await bluetooth.remember(echelonBike);
  assets = await WorldAssets.install(page);
  loading = new WorldLoadingPage(page);
  ride = new ClassRidePage(page);
});

test.afterEach(() => assets.dispose());

test("No bike, ready, and the world faded in, at XL", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await ride.open(hiitCardio.id);
  await panoramaShown(page);
  await expect(loading.cardTitle).toHaveText("Old Town Criterium is ready", { timeout: 30_000 });
  await expect(loading.connectBike).toBeVisible();
  await shot(page, "nobike-xl");
  await connectBike(bluetooth);
  await expect(loading.start).toBeFocused();
  await page.mouse.move(0, 0);
  await shot(page, "ready-xl");
  await loading.start.click();
  await worldShown(page);
  await shot(page, "world-xl");
});

for (const size of ["XS", "M", "L"] as Size[]) {
  test(`The world faded in, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await ride.open(hiitCardio.id);
    await connectBike(bluetooth);
    await expect(loading.cardTitle).toHaveText("Old Town Criterium is ready", { timeout: 30_000 });
    await loading.start.click();
    await worldShown(page);
    await shot(page, `world-${size.toLowerCase()}`);
  });
}

test("Without the class video, on the panorama, at XL", async ({ page, bluetooth, webgl, youtube }) => {
  await frame(page, "XL");
  await webgl.disable();
  youtube.block();
  await ride.open(hiitCardio.id);
  await connectBike(bluetooth);
  await expect(loading.start).toBeEnabled();
  await loading.start.click();
  await expect(ride.videoNotice).toBeVisible();
  await expect.poll(() => ride.worldPanorama.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.mouse.move(0, 0);
  await shot(page, "novideo-xl");
});

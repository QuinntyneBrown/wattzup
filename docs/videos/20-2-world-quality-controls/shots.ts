import { ECHELON_NOTIFY, echelonBike, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import { storeSettings } from "../../../frontend/e2e/fixtures/settings-storage";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { RacePage } from "../../../frontend/e2e/pages/race.page";
import { SettingsPage } from "../../../frontend/e2e/pages/settings.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 20.2, World quality controls, in the running app, through the flows of
 * e2e/settings-world.spec.ts and e2e/race-world-settings.spec.ts: Settings' World section at 390, 768, 1024 and 1440 px
 * where WebGPU is offered; the section with High chosen, without WebGPU, and where the browser can't draw 3D; and a solo
 * race at 1920 × 1080 on the real clock, its world opened at Medium. Only
 * `node tools/video-record/record.mjs docs/videos/20-2-world-quality-controls`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the World section at ${size}`, async ({ page, bluetooth, webgl }) => {
    await frame(page, size);
    await webgl.withWebGpu();
    await bluetooth.remember(echelonBike);
    const settings = new SettingsPage(page);
    await settings.open("world");
    await expect(settings.graphicsApi).toHaveText("WebGPU");
    await page.mouse.move(0, 0);
    await shot(page, `world-${size.toLowerCase()}`);
  });
}

test("High chosen, with step-down the rider's", async ({ page, bluetooth, webgl }) => {
  await frame(page, "XL");
  await webgl.withWebGpu();
  await bluetooth.remember(echelonBike);
  const settings = new SettingsPage(page);
  await settings.open("world");
  await settings.quality("High").check();
  await expect(settings.stepDown).toBeEnabled();
  await page.mouse.move(0, 0);
  await detail(settings.section("World"), "world-high");
});

test("without WebGPU", async ({ page, bluetooth, webgl }) => {
  await frame(page, "XL");
  await webgl.withoutWebGpu();
  await bluetooth.remember(echelonBike);
  const settings = new SettingsPage(page);
  await settings.open("world");
  await expect(settings.graphicsApi).toHaveText("WebGL 2");
  await page.mouse.move(0, 0);
  await detail(settings.section("World"), "world-webgl2");
});

test("where the browser can't draw 3D", async ({ page, bluetooth, webgl }) => {
  await frame(page, "XL");
  await webgl.disable();
  await bluetooth.remember(echelonBike);
  const settings = new SettingsPage(page);
  await settings.open("world");
  await expect(settings.noWorlds).toBeVisible();
  await page.mouse.move(0, 0);
  await detail(settings.section("World"), "world-none");
});

test("a race whose world opens at Medium", async ({ page, bluetooth, webgl }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await webgl.withoutWebGpu();
  await storeSettings(page, JSON.stringify({ quality: "medium" }));
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open("old-town-criterium", "mode=solo");
  await expect(race.backend).toBeVisible({ timeout: 60_000 });
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
  await page.mouse.move(0, 0);
  await shot(page, "race-medium");
});

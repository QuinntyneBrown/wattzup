import { catalogue, hiitCardio } from "../../../frontend/e2e/fixtures/classes";
import { connectBike } from "../../../frontend/e2e/fixtures/class-ride";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { THREE_WORLDS, saveWorlds } from "../../../frontend/e2e/fixtures/saved-worlds";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { WorldAssets } from "../../../frontend/e2e/fixtures/world-assets";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { SettingsPage } from "../../../frontend/e2e/pages/settings.page";
import { WorldLoadingPage } from "../../../frontend/e2e/pages/world-loading.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 20.5, Manage saved worlds, in the running app, through the flows of
 * e2e/settings-saved-worlds.spec.ts: Settings opened at This device with Prairie Paceline, Old Town Criterium and
 * Cliffside Coast saved (61 MB) at 390, 768, 1024 and 1440 px; the section close up; after Clear saved worlds, with
 * its toast, at 1440 and 390 px; and World loading done with Old Town Criterium's panorama downloaded and saved. Only
 * `node tools/video-record/record.mjs docs/videos/20-5-manage-saved-worlds`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`This device with three saved worlds at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const settings = new SettingsPage(page);
    await settings.open("device");
    await saveWorlds(page, THREE_WORLDS);
    await page.reload();
    await expect(settings.savedWorlds).toHaveText("3 worlds · 61 MB", { timeout: 30_000 });
    await settings.section("This device").evaluate((section) => section.scrollIntoView({ block: "center" }));
    await page.mouse.move(0, 0);
    await shot(page, `device-${size.toLowerCase()}`);
  });
}

test("This device close up", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await bluetooth.remember(echelonBike);
  const settings = new SettingsPage(page);
  await settings.open("device");
  await saveWorlds(page, THREE_WORLDS);
  await page.reload();
  await expect(settings.savedWorlds).toHaveText("3 worlds · 61 MB", { timeout: 30_000 });
  await page.mouse.move(0, 0);
  await detail(page.locator("wz-device-settings"), "device");
});

for (const size of ["XL", "XS"] as Size[]) {
  test(`cleared, with its toast, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const settings = new SettingsPage(page);
    await settings.open("device");
    await saveWorlds(page, THREE_WORLDS);
    await page.clock.install();
    await page.reload();
    await expect(settings.savedWorlds).toHaveText("3 worlds · 61 MB", { timeout: 30_000 });
    await settings.section("This device").evaluate((section) => section.scrollIntoView({ block: "center" }));
    await settings.clearSavedWorlds.click();
    await expect(settings.toastText).toHaveText(
      "61 MB freed. Each world downloads again the next time you ride it.",
    );
    await page.mouse.move(0, 0);
    await shot(page, `cleared-${size.toLowerCase()}`);
  });
}

test("World loading with the world downloaded and saved", async ({ page, bluetooth, api, webgl }) => {
  await frame(page, "XL");
  api.answer("GET", "/api/classes", catalogue);
  await bluetooth.remember(echelonBike);
  await webgl.disable();
  const assets = await WorldAssets.install(page);
  const loading = new WorldLoadingPage(page);
  await new ClassRidePage(page).open(hiitCardio.id);
  await connectBike(bluetooth);
  await expect(loading.step(0).label).toHaveText("Download the panorama: Done", { timeout: 30_000 });
  await page.mouse.move(0, 0);
  await shot(page, "loading");
  await assets.dispose();
});

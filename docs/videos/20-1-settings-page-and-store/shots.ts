import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { refuseStorage } from "../../../frontend/e2e/fixtures/settings-storage";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ProfilePage } from "../../../frontend/e2e/pages/profile.page";
import { SettingsPage } from "../../../frontend/e2e/pages/settings.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 20.1, Settings page and store, in the running app, through the flows of
 * e2e/settings.spec.ts: Profile with its Ride settings row; Settings at 390, 768, 1024 and 1440 px; Keep the screen
 * awake turned off, and the page after Reset to recommended; and the warning when the browser refuses storage. Only `node tools/video-record/record.mjs docs/videos/20-1-settings-page-and-store`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Settings at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const settings = new SettingsPage(page);
    await settings.open();
    await expect(settings.keepAwake).toHaveAttribute("aria-checked", "true");
    await page.mouse.move(0, 0);
    await shot(page, `settings-${size.toLowerCase()}`);
  });
}

test("Profile's Ride settings row", async ({ page, bluetooth }) => {
  await frame(page, "L");
  await bluetooth.remember(echelonBike);
  const profile = new ProfilePage(page);
  await profile.open();
  await expect(profile.rideSettings).toBeVisible();
  await profile.rideSettings.hover();
  await shot(page, "profile-l");
  await detail(profile.settings, "profile-rows");
});

test("Keep the screen awake turned off, then Reset to recommended", async ({ page, bluetooth }) => {
  await frame(page, "L");
  await bluetooth.remember(echelonBike);
  const settings = new SettingsPage(page);
  await settings.open("display");
  await settings.keepAwake.click();
  await expect(settings.keepAwake).toHaveAttribute("aria-checked", "false");
  await page.mouse.move(0, 0);
  await detail(settings.section("Motion and display"), "keep-awake-off");
  await settings.reset.scrollIntoViewIfNeeded();
  await shot(page, "reset-before");
  await settings.reset.click();
  await expect(settings.keepAwake).toHaveAttribute("aria-checked", "true");
  await page.mouse.move(0, 0);
  await detail(settings.section("Motion and display"), "keep-awake-on");
});

test("the warning when the browser refuses storage", async ({ page, bluetooth }) => {
  await frame(page, "L");
  await bluetooth.remember(echelonBike);
  await refuseStorage(page);
  const settings = new SettingsPage(page);
  await settings.open();
  await expect(settings.notStored).toBeVisible();
  await page.mouse.move(0, 0);
  await shot(page, "refused-l");
});


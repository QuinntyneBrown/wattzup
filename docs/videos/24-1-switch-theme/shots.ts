import { startCustomRide } from "../../../frontend/e2e/fixtures/custom-ride";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { AppDocument } from "../../../frontend/e2e/pages/app-document";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { SettingsPage } from "../../../frontend/e2e/pages/settings.page";
import { type Size, SIZES, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 24.1, Switch theme, in the running app, through the fixtures and page objects of
 * e2e/theme.spec.ts: Home on a device that asks for light at 390, 768, 1024 and 1440 px and on one that asks for dark at
 * 390 px; the custom ride in light at 1440 px; and Settings' Theme choice in light at 390 px. The fake Bluetooth stack
 * and the API fixture stand in, so no real bike or backend ran. Not a test: only
 * `node tools/video-record/record.mjs docs/videos/24-1-switch-theme`.
 */

const home = async (page: import("@playwright/test").Page, scheme: "light" | "dark") => {
  await page.emulateMedia({ colorScheme: scheme });
  const screen = new HomePage(page);
  await screen.open();
  await expect(screen.greeting).toBeVisible();
  await expect(new AppDocument(page).root).toHaveAttribute("data-theme", scheme);
  await pictures(page);
  await page.mouse.move(0, 0);
};

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Home in light at ${SIZES[size].width} px`, async ({ page, bluetooth }) => {
    await bluetooth.remember(echelonBike);
    await frame(page, size);
    await home(page, "light");
    await shot(page, `home-light-${size.toLowerCase()}`);
  });
}

test("Home in dark at 390 px", async ({ page, bluetooth }) => {
  await bluetooth.remember(echelonBike);
  await frame(page, "XS");
  await home(page, "dark");
  await shot(page, "home-dark-xs");
});

test("the custom ride in light at 1440 px", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await page.emulateMedia({ colorScheme: "light" });
  await startCustomRide(page, bluetooth);
  await page.clock.resume();
  await page.mouse.move(0, 0);
  await shot(page, "custom-ride-light-xl");
});

test("Settings' Theme in light at 390 px", async ({ page, bluetooth }) => {
  await bluetooth.remember(echelonBike);
  await frame(page, "XS");
  await page.emulateMedia({ colorScheme: "light" });
  const settings = new SettingsPage(page);
  await settings.open("display");
  await settings.theme.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await page.mouse.move(0, 0);
  await shot(page, "settings-theme-light-xs");
});

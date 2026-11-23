import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { library } from "../../../frontend/e2e/fixtures/library";
import { maps } from "../../../frontend/e2e/fixtures/maps";
import { midRiderProgress } from "../../../frontend/e2e/fixtures/progress";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassLibraryPage } from "../../../frontend/e2e/pages/class-library.page";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { MapSelectPage } from "../../../frontend/e2e/pages/map-select.page";
import { ProfilePage } from "../../../frontend/e2e/pages/profile.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 13.1, App header, in the running app: Map Select for the mocks' mid rider at 390,
 * 768, 1024 and 1440 px; Home's header with Full screen with Full screen, and in full screen with Exit full screen; and Map Select, the
 * Class Library and Profile, each with its own item current. The shared fixture serves the rider's progress, the maps
 * and the classes, and remembers a bike. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/13-1-app-header`.
 */

test.beforeEach(async ({ api, bluetooth }) => {
  await bluetooth.remember(echelonBike);
  api.answer("GET", "/api/progress", midRiderProgress);
  api.answer("GET", "/api/maps", maps);
  api.answer("GET", "/api/classes", library);
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Map Select at ${size}`, async ({ page }) => {
    await frame(page, size);
    const select = new MapSelectPage(page);
    await select.open();
    await expect(select.header.levelBadge).toHaveText("7");
    await expect(select.rows).toHaveCount(7);
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() => page.locator("img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete)))
      .toBe(true);
    await shot(page, `race-${size.toLowerCase()}`);
    if (size === "XS") await detail(select.header.root, "header-xs", 0);
  });
}

test("Full screen, in and out, and every page's current item, at XL", async ({ page }) => {
  await frame(page, "XL");
  const home = new HomePage(page);
  await home.open();
  await expect(home.header.levelBadge).toHaveText("7");
  await page.evaluate(() => document.fonts.ready);
  await detail(home.header.root, "header-xl", 0);

  await home.header.fullScreen.click();
  await expect(home.header.exitFullScreen).toBeVisible();
  await page.mouse.move(0, 0);
  await detail(home.header.root, "header-full-xl", 0);
  await home.header.exitFullScreen.click();
  await expect(home.header.fullScreen).toBeVisible();

  for (const [name, screen] of [
    ["race", new MapSelectPage(page)],
    ["classes", new ClassLibraryPage(page)],
    ["profile", new ProfilePage(page)],
  ] as const) {
    await screen.open();
    await expect(screen.header.current()).toBeVisible();
    await page.mouse.move(0, 0);
    await detail(screen.header.root, `header-${name}-xl`, 0);
  }
});

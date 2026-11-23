import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { AppInstall } from "../../../frontend/e2e/pages/app-install";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { type Size, SIZES, frame, shot, shotsDir } from "../../../tools/video-record/shots";

/**
 * The pictures of the film of slice 27.1, Installable app: Home in the running app at 390, 768, 1024 and 1440 px, after
 * Chromium has found it installable through the page object of e2e/install.spec.ts, and the three icons the manifest
 * lists, copied from the ride app's public/icons/ as they are. Not a test: only
 * `node tools/video-record/record.mjs docs/videos/27-1-installable-app`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Home, installable, at ${SIZES[size].width} px`, async ({ page }) => {
    await frame(page, size);
    const home = new HomePage(page);
    await home.open();
    await expect(home.greeting).toBeVisible();
    expect(await new AppInstall(page).installabilityErrors()).toEqual([]);
    await page.mouse.move(0, 0);
    await shot(page, `home-${size.toLowerCase()}`);
  });
}

test("the icons the manifest lists", async () => {
  const icons = path.resolve(__dirname, "../../../frontend/projects/ride/public/icons");
  await mkdir(shotsDir, { recursive: true });
  for (const name of ["icon-192", "icon-512", "icon-maskable-512"]) {
    await copyFile(path.join(icons, `${name}.png`), path.join(shotsDir, `${name}.png`));
  }
});

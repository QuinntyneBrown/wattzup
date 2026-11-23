import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { NotFoundPage } from "../../../frontend/e2e/pages/not-found.page";
import {
  type Size,
  detail,
  detailAll,
  frame,
  shot,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 1.1, Frontend workspace, in the running app: Home in the app
 * shell and Page not found at 390, 768, 1024 and 1440 px, the header's lockup and navigation, the
 * focused skip link and "Back to Home". The shared fixture fails on any page error or request off
 * this machine, as in every spec; no backend and no bike ran. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/01-1-frontend-workspace`.
 */

const sizes: Size[] = ["XS", "M", "L", "XL"];

for (const size of sizes) {
  test(`Home and Page not found at ${size}`, async ({ page }) => {
    await frame(page, size);
    const home = new HomePage(page);
    await home.open();
    await expect(home.header.current()).toHaveText("Home");
    await expect.poll(() => home.header.wordmarkFontLoaded()).toBe(true);
    await shot(page, `home-${size.toLowerCase()}`);

    const notFound = new NotFoundPage(page);
    await notFound.open("/no-such-screen");
    await expect(notFound.heading).toHaveText("This page doesn’t exist.");
    await expect(notFound.header.current()).toHaveCount(0);
    await shot(page, `not-found-${size.toLowerCase()}`);
  });
}

test("close-ups at 1440 px", async ({ page }) => {
  await frame(page, "XL");
  const home = new HomePage(page);
  await home.open();
  await expect(home.header.current()).toHaveText("Home");
  await expect.poll(() => home.header.wordmarkFontLoaded()).toBe(true);
  await detailAll([home.header.brand, home.header.nav], "header", 14);
  await detail(home.header.lockup, "lockup", 10);
  await detail(home.header.current(), "current", 10);

  // The first Tab brings the skip link into view, focused.
  await page.keyboard.press("Tab");
  await expect(home.skipLink).toBeFocused();
  await shot(page, "skip-xl");
  await detail(home.skipLink, "skip-link", 16);

  const notFound = new NotFoundPage(page);
  await notFound.open("/no-such-screen");
  await expect(notFound.heading).toHaveText("This page doesn’t exist.");
  await detailAll([notFound.heading, notFound.backHome], "not-found-message", 20);
  await detail(notFound.backHome, "back-home", 14);
});

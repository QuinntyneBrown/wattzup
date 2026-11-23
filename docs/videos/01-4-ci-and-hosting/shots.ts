import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 1.4, CI and hosting, in the running app: Home in the app
 * shell at 390, 768, 1024 and 1440 px. The slice adds no screen: it serves the same app from the API, as one origin.
 * The shared fixture fails on any page error or request off this machine, as in every spec; no
 * backend and no bike ran. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/01-4-ci-and-hosting`.
 */

const sizes: Size[] = ["XS", "M", "L", "XL"];

for (const size of sizes) {
  test(`Home at ${size}`, async ({ page }) => {
    await frame(page, size);
    const home = new HomePage(page);
    await home.open();
    await expect(home.header.current()).toHaveText("Home");
    await expect.poll(() => home.header.wordmarkFontLoaded()).toBe(true);
    await shot(page, `home-${size.toLowerCase()}`);
  });
}

import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 22.4, Restrict third parties, in the running app, through the flow of
 * e2e/content-security-policy.spec.ts: Home served with the Content Security Policy and the headers the API sends, at
 * 390, 768, 1024 and 1440 px, with no refusal. The fake Bluetooth stack remembers the bike, so no real bike ran. Not a
 * test and not a sweep: only `node tools/video-record/record.mjs docs/videos/22-4-restrict-third-parties`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Home under its policy, at ${size}`, async ({ page, bluetooth, policy }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const home = new HomePage(page);
    await home.open();
    await expect(home.greeting).toBeVisible();
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `home-${size.toLowerCase()}`);
    expect(policy.take()).toEqual([]);
  });
}

import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { screens } from "../../../frontend/e2e/fixtures/screens";
import { AppDocument } from "../../../frontend/e2e/pages/app-document";
import { type Size, SIZES, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 24.2, Full screen, in the running app, through the shared screens table and the
 * page objects of e2e/full-screen-everywhere.spec.ts: a race at 1440 px with close-ups of its header's end before and
 * in full screen; Results, Connect Bike and Class Start on a phone; a class ride at 1440 px; and Race Setup at 390, 768,
 * 1024 and 1440 px. The fake Bluetooth stack and the API fixture stand in, so no real bike or backend ran. Not a test:
 * only `node tools/video-record/record.mjs docs/videos/24-2-full-screen`.
 */

test("a race at 1440 px, and its Full screen", async ({ page, bluetooth, api }) => {
  await frame(page, "XL");
  await (await screens["a race"]!({ page, bluetooth, api })).waitFor({ state: "attached" });
  await page.clock.resume();
  const app = new AppDocument(page);
  await page.mouse.move(0, 0);
  await shot(page, "race-xl");
  await detail(app.fullScreen, "race-full-screen", 140);
  await app.fullScreen.click();
  await expect.poll(() => app.inFullScreen()).toBe(true);
  await page.mouse.move(0, 0);
  await detail(app.exitFullScreen, "race-exit-full-screen", 140);
});

test("a class ride at 1440 px", async ({ page, bluetooth, api }) => {
  await frame(page, "XL");
  await (await screens["a class ride"]!({ page, bluetooth, api })).waitFor({ state: "attached" });
  await page.clock.resume();
  await page.mouse.move(0, 0);
  await shot(page, "class-ride-xl");
});

for (const screen of ["Results", "Connect Bike", "Class Start"]) {
  test(`${screen} at 390 px`, async ({ page, bluetooth, api }) => {
    await frame(page, "XS");
    await (await screens[screen]!({ page, bluetooth, api })).waitFor({ state: "attached" });
    await expect(new AppDocument(page).fullScreen).toBeVisible();
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `${screen.toLowerCase().replace(/ /g, "-")}-xs`);
  });
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Race Setup at ${SIZES[size].width} px`, async ({ page, bluetooth, api }) => {
    await frame(page, size);
    await (await screens["Race Setup"]!({ page, bluetooth, api })).waitFor({ state: "attached" });
    await expect(new AppDocument(page).fullScreen).toBeVisible();
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `race-setup-${size.toLowerCase()}`);
  });
}

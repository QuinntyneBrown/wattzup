import { screens } from "../../../frontend/e2e/fixtures/screens";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { AppDocument } from "../../../frontend/e2e/pages/app-document";
import { type Size, SIZES, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 23.1, Fit every width, in the running app, through the screens of
 * e2e/fit-every-width.spec.ts: Home, Map Select, Settings and Results at 320 px, the custom ride at 320 px with a close-up
 * of its wrapped clock and buttons and at 390, 768, 1024 and 1440 px, and Home at 2560 px. Each is checked not to
 * scroll sideways before it is taken. The fake Bluetooth stack and the API fixture stand in, so no real bike or backend
 * ran. Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/23-1-fit-every-width`.
 */

const narrow = { Home: "home", "Map Select": "map-select", Settings: "settings", Results: "results" } as const;

for (const [screen, name] of Object.entries(narrow)) {
  test(`${screen} at 320 px`, async ({ page, bluetooth, api }) => {
    await frame(page, "XS");
    await page.setViewportSize({ width: 320, height: 640 });
    await expect(await screens[screen]({ page, bluetooth, api })).toBeAttached();
    expect(await new AppDocument(page).scrollsSideways()).toBe(false);
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `${name}-320`);
  });
}

test("the custom ride at 320 px", async ({ page, bluetooth, api }) => {
  await frame(page, "XS");
  await page.setViewportSize({ width: 320, height: 640 });
  await expect(await screens["a custom ride"]({ page, bluetooth, api })).toBeAttached();
  await page.clock.resume();
  expect(await new AppDocument(page).scrollsSideways()).toBe(false);
  await page.mouse.move(0, 0);
  await shot(page, "custom-ride-320");
  await detail(page.locator(".ride-header__end"), "ride-header-320", 12);
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the custom ride at ${SIZES[size].width} px`, async ({ page, bluetooth, api }) => {
    await frame(page, size);
    await expect(await screens["a custom ride"]({ page, bluetooth, api })).toBeAttached();
    await page.clock.resume();
    await page.mouse.move(0, 0);
    await shot(page, `custom-ride-${size.toLowerCase()}`);
  });
}

test("Home at 2560 px", async ({ page, bluetooth, api }) => {
  await frame(page, "XL");
  await page.setViewportSize({ width: 2560, height: 1440 });
  await expect(await screens["Home"]({ page, bluetooth, api })).toBeVisible();
  expect(await new AppDocument(page).scrollsSideways()).toBe(false);
  await pictures(page);
  await page.mouse.move(0, 0);
  await shot(page, "home-2560");
});

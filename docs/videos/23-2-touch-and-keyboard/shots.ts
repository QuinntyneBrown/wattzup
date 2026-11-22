import type { Page } from "@playwright/test";
import { screens } from "../../../frontend/e2e/fixtures/screens";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { AppDocument } from "../../../frontend/e2e/pages/app-document";
import { SettingsPage } from "../../../frontend/e2e/pages/settings.page";
import { type Size, SIZES, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 23.2, Touch and keyboard, in the running app, through the screens of
 * e2e/touch-and-keyboard.spec.ts: Settings and the custom ride at 390 px with the square each control's tap is checked
 * across drawn over it (44 px, 48 px mid-ride), the class ride's 48 px header, the focus ring on Home's race button and
 * on a class card at 1440 px, and Settings at 390, 768, 1024 and 1440 px. Each phone screen is first checked to have no
 * control a tap misses. The fake Bluetooth stack and the API fixture stand in, so no real bike or backend ran. Not a
 * test and not a sweep: only `node tools/video-record/record.mjs docs/videos/23-2-touch-and-keyboard`.
 */

/** Draws, over the page, the square a tap of `size` px is checked across on each control in the window. */
async function drawTapSquares(page: Page, size: number): Promise<void> {
  await page.evaluate((side) => {
    const controls = document.querySelectorAll<HTMLElement & { labels?: NodeListOf<HTMLLabelElement> }>(
      'a[href], button:not(:disabled), input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])',
    );
    for (const control of controls) {
      if (control.matches(".skip-link, .ride-levels__bar")) continue;
      const box = control.getBoundingClientRect();
      if (box.width < 2 || box.height < 2 || box.bottom < 0 || box.top > innerHeight) continue;
      // Only a control the rider can see: not one scrolled under the sticky header.
      const seen = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      if (!seen || !(control.contains(seen) || control.labels?.[0]?.contains(seen))) continue;
      const square = document.createElement("div");
      const width = Math.max(side, box.width);
      const height = Math.max(side, box.height);
      Object.assign(square.style, {
        position: "fixed",
        left: `${box.left + box.width / 2 - width / 2}px`,
        top: `${box.top + box.height / 2 - height / 2}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: "2px dashed var(--color-focus-ring)",
        background: "color-mix(in srgb, var(--color-focus-ring) 18%, transparent)",
        borderRadius: "6px",
        pointerEvents: "none",
        zIndex: "9999",
      });
      document.body.append(square);
    }
  }, size);
}

/** Tabs from the top of the page until the focus lands on a control whose name starts with `name`. */
async function tabTo(page: Page, name: string): Promise<void> {
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const now = await page.evaluate(() => (document.activeElement?.textContent ?? "").trim());
    if (now.startsWith(name)) return;
  }
  throw new Error(`Tab never reached "${name}".`);
}

test("Settings' tap areas at 390 px", async ({ page, bluetooth, api }) => {
  await frame(page, "XS");
  await expect(await screens["Settings"]({ page, bluetooth, api })).toBeVisible();
  expect(await new AppDocument(page).untappable(44)).toEqual([]);
  await new SettingsPage(page)
    .section("Sound")
    .evaluate((section) => section.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.mouse.move(0, 0);
  await shot(page, "settings-display-xs");
  await drawTapSquares(page, 44);
  await shot(page, "settings-taps-xs");
});

test("the class ride's header at 390 px", async ({ page, bluetooth, api }) => {
  await frame(page, "XS");
  await expect(await screens["a class ride"]({ page, bluetooth, api })).toBeAttached();
  await page.clock.resume();
  expect(await new AppDocument(page).untappable(48, [".ride-levels__bar"])).toEqual([]);
  await page.mouse.move(0, 0);
  await shot(page, "class-ride-xs");
  await drawTapSquares(page, 48);
  await detail(page.locator(".class-ride__action").first().locator(".."), "class-ride-header-taps", 20);
});

test("the custom ride's tap areas at 390 px", async ({ page, bluetooth, api }) => {
  await frame(page, "XS");
  await expect(await screens["a custom ride"]({ page, bluetooth, api })).toBeAttached();
  await page.clock.resume();
  expect(await new AppDocument(page).untappable(48, [".ride-levels__bar"])).toEqual([]);
  await page.evaluate(() => scrollTo(0, 0));
  await page.mouse.move(0, 0);
  await drawTapSquares(page, 48);
  await shot(page, "custom-ride-taps-xs");
});

test("the focus ring on Home at 1440 px", async ({ page, bluetooth, api }) => {
  await frame(page, "XL");
  await expect(await screens["Home"]({ page, bluetooth, api })).toBeVisible();
  await pictures(page);
  await page.mouse.move(0, 0);
  await tabTo(page, "Race Prairie");
  await shot(page, "home-focus-xl");
  await detail(page.locator(":focus"), "home-focus-detail", 40);
});

test("the focus ring on a class card at 1440 px", async ({ page, bluetooth, api }) => {
  await frame(page, "XL");
  await expect(await screens["the Class Library"]({ page, bluetooth, api })).toBeVisible();
  await pictures(page);
  await page.mouse.move(0, 0);
  await tabTo(page, "30:00");
  await detail(page.locator(":focus"), "class-card-focus", 24);
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Settings at ${SIZES[size].width} px`, async ({ page, bluetooth, api }) => {
    await frame(page, size);
    await expect(await screens["Settings"]({ page, bluetooth, api })).toBeVisible();
    await page.mouse.move(0, 0);
    await shot(page, `settings-${size.toLowerCase()}`);
  });
}

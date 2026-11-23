import { maps } from "../../../frontend/e2e/fixtures/maps";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { MapSelectPage } from "../../../frontend/e2e/pages/map-select.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 7.1, Browse maps, in the running app: Map Select for a new rider at 390, 768,
 * 1024 and 1440 px, close-ups at 390 px of an open map, the next unlock and a locked map, the star rules, and Map Select
 * with no catalogue to read. The shared fixture's API fixture serves the map catalogue (or 503). Not a test and not a sweep:
 * only `node tools/video-record/record.mjs docs/videos/07-1-browse-maps`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Map Select at ${size}`, async ({ page, api }) => {
    api.answer("GET", "/api/maps", maps);
    await frame(page, size);
    const select = new MapSelectPage(page);
    await select.open();
    await expect(select.rows).toHaveCount(7);
    await page.evaluate(() => document.fonts.ready);
    await pictures(page);
    await shot(page, `maps-${size.toLowerCase()}`);
    // A row fills a phone's width, so its close-up reads at film size; the aside sits beside the path from lg.
    if (size === "XS") {
      await detail(select.row("Prairie Paceline").root, "open", 12);
      await detail(select.row("Cliffside Coast").root, "next", 12);
      await detail(select.row("Neon Docklands").root, "locked", 12);
    }
    if (size === "XL") await detail(select.aside, "aside", 16);
  });
}

test("Map Select with no catalogue at XL", async ({ page, api }) => {
  api.answer("GET", "/api/maps", () => ({ status: 503 }));
  await frame(page, "XL");
  const select = new MapSelectPage(page);
  await select.open();
  await expect(select.retry).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await shot(page, "unavailable-xl");
});

test("Map Select with no catalogue at XS", async ({ page, api }) => {
  api.answer("GET", "/api/maps", () => ({ status: 503 }));
  await frame(page, "XS");
  const select = new MapSelectPage(page);
  await select.open();
  await expect(select.retry).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await detail(page.locator(".maps-error"), "error", 12);
});

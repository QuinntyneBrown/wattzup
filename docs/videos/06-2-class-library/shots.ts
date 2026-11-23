import { library } from "../../../frontend/e2e/fixtures/library";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassLibraryPage } from "../../../frontend/e2e/pages/class-library.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 6.2, Class library, in the running app: the Class Library for the new rider at
 * 390, 768, 1024 and 1440 px, the 30 min tab chosen, close-ups of the tabs and of an open and a locked card, and the
 * library with no catalogue to read. The shared fixture's API fixture serves the catalogue (or 503), and its YouTube
 * fixture the mocks' covers. Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/06-2-class-library`.
 */

async function settle(classes: ClassLibraryPage, page: import("@playwright/test").Page): Promise<void> {
  await expect(classes.cardTitles).toHaveCount(7);
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() => page.locator(".class-card img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete)))
    .toBe(true);
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Class Library at ${size}`, async ({ page, api }) => {
    api.answer("GET", "/api/classes", library);
    await frame(page, size);
    const classes = new ClassLibraryPage(page);
    await classes.open();
    await settle(classes, page);
    await shot(page, `library-${size.toLowerCase()}`);
    if (size !== "XL") return;

    await detail(classes.card("30 Minute HIIT Cardio").root, "open", 16);
    await detail(classes.card("30 Min Vice City Pyramid").root, "locked", 16);
    await page.mouse.move(0, 0);
    await classes.tab("30 min").click();
    await expect(classes.shelfTitles).toHaveText(["30 min"]);
    await shot(page, "tier-30-xl");
    await classes.tab("30 min").focus();
    await page.keyboard.press("ArrowRight");
    await expect(classes.shelfTitles).toHaveText(["60 min endurance"]);
    await detail(classes.tabList, "tabs", 16);
    await shot(page, "tier-60-xl");
  });
}

test("Class Library with no catalogue at XL", async ({ page, api }) => {
  api.answer("GET", "/api/classes", () => ({ status: 503 }));
  await frame(page, "XL");
  const classes = new ClassLibraryPage(page);
  await classes.open();
  await expect(classes.retry).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await shot(page, "unavailable-xl");
  await detail(page.locator(".library-error"), "error", 16);
});

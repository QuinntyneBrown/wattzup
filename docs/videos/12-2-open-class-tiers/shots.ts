import { newRiderProgress } from "../../../frontend/e2e/fixtures/api";
import { library } from "../../../frontend/e2e/fixtures/library";
import { midRiderProgress, veteranProgress } from "../../../frontend/e2e/fixtures/progress";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassLibraryPage } from "../../../frontend/e2e/pages/class-library.page";
import { ClassStartPage } from "../../../frontend/e2e/pages/class-start.page";
import type { ProgressDto } from "../../../frontend/projects/api/src/public-api";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 12.2, Open class tiers, in the running app: the Class Library for the mocks' mid
 * rider (level 7) at 390, 768, 1024 and 1440 px, for a new rider (level 1) and for the veteran (level 18), and Class
 * Start for 30 Min Tempo Paceline, which level 5 opens. The shared fixture's API fixture serves the catalogue and the
 * rider's progress, and its YouTube fixture the covers. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/12-2-open-class-tiers`.
 */

async function library_(page: import("@playwright/test").Page, api: { answer: (m: string, p: string, o: unknown) => void }, progress: ProgressDto | object): Promise<ClassLibraryPage> {
  api.answer("GET", "/api/progress", progress);
  const classes = new ClassLibraryPage(page);
  await classes.open();
  await expect(classes.cardTitles).toHaveCount(7);
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() => page.locator(".class-card img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete)))
    .toBe(true);
  await page.mouse.move(0, 0);
  return classes;
}

test.beforeEach(({ api }) => api.answer("GET", "/api/classes", library));

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  if (size === "XL") continue;
  test(`the mid rider's classes at ${size}`, async ({ page, api }) => {
    await frame(page, size);
    await library_(page, api, midRiderProgress);
    await shot(page, `mid-${size.toLowerCase()}`);
  });
}

test("a new rider's and the veteran's classes, and Tempo Paceline's Class Start, at XL", async ({ page, api }) => {
  await frame(page, "XL");
  for (const [name, progress] of [["new", newRiderProgress], ["mid", midRiderProgress], ["veteran", veteranProgress]] as const) {
    const classes = await library_(page, api, progress);
    await shot(page, `${name}-xl`);
    await classes.shelfTitles.nth(1).evaluate((title) => title.scrollIntoView({ block: "start", behavior: "instant" }));
    await shot(page, `${name}-longer-xl`);
  }

  const classes = await library_(page, api, midRiderProgress);
  await classes.card("30 Min Tempo Paceline").root.click();
  await expect(new ClassStartPage(page).title).toHaveText("30 Min Tempo Paceline");
  await expect
    .poll(() => page.locator("img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete)))
    .toBe(true);
  await shot(page, "start-tempo-xl");
});

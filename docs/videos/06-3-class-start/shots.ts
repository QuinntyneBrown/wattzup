import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { library } from "../../../frontend/e2e/fixtures/library";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import { ClassStartPage } from "../../../frontend/e2e/pages/class-start.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 6.3, Class Start, in the running app: 30 Minute HIIT Cardio's Class Start at
 * 390, 768, 1024 and 1440 px, close-ups of "What the bike will do", of "Video link and sync" opened and of "How do you
 * want to ride?", and the class ride Start class opens. The shared fixture's API fixture serves the catalogue, its
 * Bluetooth fixture the remembered bike, and its YouTube fixture the mocks' covers and a fake player. Not a test and
 * not a sweep: only `node tools/video-record/record.mjs docs/videos/06-3-class-start`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Class Start at ${size}`, async ({ page, api, bluetooth }) => {
    api.answer("GET", "/api/classes", library);
    await bluetooth.remember(echelonBike);
    await frame(page, size);
    const start = new ClassStartPage(page);
    await start.open("hiit-cardio-30");
    await expect(start.title).toHaveText("30 Minute HIIT Cardio");
    await page.evaluate(() => document.fonts.ready);
    await pictures(page);
    await shot(page, `start-${size.toLowerCase()}`);
    if (size !== "XL") return;

    await detail(page.locator(".class-plan"), "plan", 16);
    await start.syncToggle.click();
    await expect(start.syncOffset).toHaveText("Synced from 0:12.0");
    await page.mouse.move(0, 0);
    await detail(page.locator(".class-sync"), "sync", 16);
    await detail(page.locator(".ride-choice__options"), "choice", 16);
    await start.start.scrollIntoViewIfNeeded();
    await shot(page, "sync-xl");

    await start.start.click();
    await expect(page).toHaveURL("/classes/hiit-cardio-30/ride?mode=solo");
    await expect(new ClassRidePage(page).name).toContainText("30 Minute HIIT Cardio");
    await pictures(page);
    await shot(page, "ride-xl");
  });
}

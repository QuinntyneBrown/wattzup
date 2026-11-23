import { maps } from "../../../frontend/e2e/fixtures/maps";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { RaceSetupPage } from "../../../frontend/e2e/pages/race-setup.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 7.2, Set up a race, in the running app: Race Setup on Prairie Paceline for a new
 * rider at 390, 768, 1024 and 1440 px, close-ups at 390 px of the stars here, the goal line, the race modes and the pack
 * strength, and Race Setup with Your best time chosen. The shared fixture's API fixture serves the map catalogue. Not a
 * test and not a sweep: only `node tools/video-record/record.mjs docs/videos/07-2-set-up-a-race`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Race Setup at ${size}`, async ({ page, api }) => {
    api.answer("GET", "/api/maps", maps);
    await frame(page, size);
    const setup = new RaceSetupPage(page);
    await setup.open("prairie-paceline");
    await expect(setup.start).toHaveText("Go to the start line");
    await page.evaluate(() => document.fonts.ready);
    await pictures(page);
    await shot(page, `setup-${size.toLowerCase()}`);
    // A block fills a phone's width, so its close-up reads at film size.
    if (size === "XS") {
      await detail(page.locator(".setup-stars"), "stars", 12);
      await detail(setup.goal, "goal", 12);
      await detail(setup.modes, "modes", 12);
      await setup.packStrength("hard").click();
      await detail(page.locator(".pack"), "pack", 12);
    }
    if (size === "XL") {
      await setup.mode("Your best time").click();
      await expect(setup.start).toHaveText("Start ride");
      await shot(page, "solo-xl");
    }
  });
}

import { maps } from "../../../frontend/e2e/fixtures/maps";
import { docklandsOpenedProgress, midRiderProgress, veteranProgress } from "../../../frontend/e2e/fixtures/progress";
import { newRiderProgress } from "../../../frontend/e2e/fixtures/api";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { MapSelectPage } from "../../../frontend/e2e/pages/map-select.page";
import { RaceSetupPage } from "../../../frontend/e2e/pages/race-setup.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 12.1, Earn stars and unlock maps, in the running app: Map Select for the mocks'
 * mid rider at 390, 768, 1024 and 1440 px, for a new rider and for the veteran; Old Town Criterium's Race Setup naming
 * the mid rider's next unlock; Dolomites' for the veteran; and Neon Docklands' Race Setup once a ride opened it. The
 * rider's progress and the catalogue are served by the shared fixture's `api`, so no request leaves the machine. Not a
 * test and not a sweep: only `node tools/video-record/record.mjs docs/videos/12-1-earn-stars-and-unlock-maps`.
 */

test.beforeEach(({ api }) => api.answer("GET", "/api/maps", maps));

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the mid rider's maps at ${size}`, async ({ page, api }) => {
    await frame(page, size);
    api.answer("GET", "/api/progress", midRiderProgress);
    const select = new MapSelectPage(page);
    await select.open();
    await expect(select.row("Neon Docklands").goal).toBeVisible();
    await pictures(page);
    await shot(page, `mid-${size.toLowerCase()}`);
  });
}

test("a new rider's and the veteran's maps at XL", async ({ page, api }) => {
  await frame(page, "XL");
  const select = new MapSelectPage(page);
  api.answer("GET", "/api/progress", newRiderProgress);
  await select.open();
  await expect(select.row("Cliffside Coast").goal).toBeVisible();
  await pictures(page);
  await shot(page, "new-xl");

  api.answer("GET", "/api/progress", veteranProgress);
  await select.open();
  await expect(select.row("Col du Granit").goal).toHaveText("Earn 3★ on Dolomites");
  await pictures(page);
  await shot(page, "veteran-xl");
  await select.row("Col du Granit").root.scrollIntoViewIfNeeded();
  await shot(page, "veteran-next-xl");
});

test("Race Setup naming the next unlock, and a map just opened, at XL", async ({ page, api }) => {
  await frame(page, "XL");
  const setup = new RaceSetupPage(page);
  api.answer("GET", "/api/progress", midRiderProgress);
  await setup.open("old-town-criterium");
  await expect(setup.goal).toBeVisible();
  await pictures(page);
  await shot(page, "setup-old-town-xl");

  api.answer("GET", "/api/progress", veteranProgress);
  await setup.open("dolomites");
  await expect(setup.goal).toBeVisible();
  await pictures(page);
  await shot(page, "setup-dolomites-xl");

  api.answer("GET", "/api/progress", docklandsOpenedProgress);
  await setup.open("neon-docklands");
  await expect(setup.title).toHaveText("Neon Docklands");
  await pictures(page);
  await shot(page, "setup-docklands-xl");
});

import { newRiderProgress } from "../../../frontend/e2e/fixtures/api";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { library } from "../../../frontend/e2e/fixtures/library";
import {
  docklandsUnseenProgress,
  levelGoalProgress,
  midRiderProgress,
} from "../../../frontend/e2e/fixtures/progress";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 13.2, Choose the next ride, in the running app: Home for the mocks' mid rider at
 * 390, 768, 1024 and 1440 px in the evening; the Next ride card for the mid rider, a new rider and a level goal; the Race
 * door and the Classes door; and the unlocked banner over a card that has moved on. The shared fixture serves the
 * rider's progress, the maps and the classes, and remembers a bike. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/13-2-home-next-ride`.
 */

const evening = new Date("2026-11-20T19:30:00Z");

test.beforeEach(async ({ page, api, bluetooth }) => {
  await bluetooth.remember(echelonBike);
  await page.clock.setFixedTime(evening);
  api.answer("GET", "/api/riders/me", { id: "c0a8e1f2-5b3d-4e6f-9a7b-8c9d0e1f2a3b", displayName: "Sam" });
  api.answer("GET", "/api/progress", midRiderProgress);
  api.answer("GET", "/api/classes", library);
  api.answer("POST", "/api/progress/unlocks/neon-docklands/seen", () => ({ status: 204 }));
});

async function ready(home: HomePage): Promise<void> {
  await expect(home.card).toBeVisible();
  await expect(home.teaser).toBeVisible();
  await pictures(home.main.page());
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Home at ${size}`, async ({ page }) => {
    await frame(page, size);
    const home = new HomePage(page);
    await home.open();
    await ready(home);
    await shot(page, `home-${size.toLowerCase()}`);
  });
}

test("the card, the doors and the greeting at XL", async ({ page }) => {
  await frame(page, "XL");
  const home = new HomePage(page);
  await home.open();
  await ready(home);
  await detail(home.greeting, "greeting-xl", 8);
  await detail(home.card, "card-xl", 0);
  await detail(home.raceDoor, "race-door-xl", 0);
  await detail(home.classDoor, "class-door-xl", 0);
});

test("a new rider and a level goal at XL", async ({ page, api }) => {
  await frame(page, "XL");
  const home = new HomePage(page);
  api.answer("GET", "/api/progress", newRiderProgress);
  await home.open();
  await ready(home);
  await detail(home.greeting, "greeting-new-xl", 8);
  await detail(home.card, "card-new-xl", 0);

  api.answer("GET", "/api/progress", levelGoalProgress);
  await home.open();
  await ready(home);
  await detail(home.card, "card-level-xl", 0);
});

test("the unlocked banner over a card that has moved on, at XL", async ({ page, api }) => {
  await frame(page, "XL");
  api.answer("GET", "/api/progress", docklandsUnseenProgress);
  const home = new HomePage(page);
  await home.open();
  await ready(home);
  await expect(home.banner).toBeVisible();
  await detail(home.banner, "banner-xl", 0);
  await shot(page, "unlocked-xl");
});

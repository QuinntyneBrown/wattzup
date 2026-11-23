import { midRiderProgress } from "../../../frontend/e2e/fixtures/api";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { ProfilePage } from "../../../frontend/e2e/pages/profile.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 10.3, Rider levels, in the running app: Home's header for the mid rider (level 7,
 * 1,840 of 2,600 XP) at 390 and 1440 px, for the veteran (level 18, 9,120 of 10,400 XP) and for a new rider, and Profile
 * naming the mid rider's level. `GET /api/progress` is answered by the shared fixture's `api`, so no request leaves the
 * machine. Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/10-3-rider-levels`.
 */

const veteran = { level: 18, totalXp: 9120, nextLevelXp: 10400, streakDays: 0 };

test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

for (const size of ["XS", "XL"] as Size[]) {
  test(`Home for the mid rider at ${size}`, async ({ page, api }) => {
    api.answer("GET", "/api/progress", midRiderProgress);
    await frame(page, size);
    const home = new HomePage(page);
    await home.open();
    await expect(home.header.levelBadge).toHaveText("7");
    await pictures(page);
    await shot(page, `home-${size.toLowerCase()}`);
  });
}

test("Home for the veteran and a new rider at XL", async ({ page, api }) => {
  api.answer("GET", "/api/progress", veteran);
  await frame(page, "XL");
  const home = new HomePage(page);
  await home.open();
  await expect(home.header.xpLabel).toHaveText("9,120 / 10,400 XP");
  await pictures(page);
  await shot(page, "veteran-xl");
  api.answer("GET", "/api/progress", { level: 1, totalXp: 0, nextLevelXp: 400, streakDays: 0 });
  await home.open();
  await expect(home.header.xpLabel).toHaveText("0 / 400 XP");
  await pictures(page);
  await shot(page, "new-xl");
});

test("Profile for the mid rider at XL", async ({ page, api }) => {
  api.answer("GET", "/api/progress", midRiderProgress);
  await frame(page, "XL");
  const profile = new ProfilePage(page);
  await profile.open();
  await expect(profile.heading).toHaveText("Ada · Level 7");
  await pictures(page);
  await shot(page, "profile-xl");
});

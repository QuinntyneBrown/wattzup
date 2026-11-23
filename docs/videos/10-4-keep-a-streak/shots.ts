import { midRiderProgress } from "../../../frontend/e2e/fixtures/api";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { ProfilePage } from "../../../frontend/e2e/pages/profile.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 10.4, Keep a streak, in the running app: Home's header for the mid rider on a
 * 4-day streak at 390 and 1440 px, Profile reading "760 XP to level 8 · 4-day streak", the veteran's 21-day streak, and
 * a new rider's Profile with no streak in the header. `GET /api/progress` is answered by the shared fixture's `api`, so
 * no request leaves the machine. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/10-4-keep-a-streak`.
 */

const veteran = { level: 18, totalXp: 9120, nextLevelXp: 10400, streakDays: 21 };

test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

for (const size of ["XS", "XL"] as Size[]) {
  test(`Home for the mid rider at ${size}`, async ({ page, api }) => {
    api.answer("GET", "/api/progress", midRiderProgress);
    await frame(page, size);
    const home = new HomePage(page);
    await home.open();
    await expect(home.header.streakCount).toHaveText("4");
    await pictures(page);
    await shot(page, `home-${size.toLowerCase()}`);
  });
}

test("Profile for the mid rider, the veteran and a new rider at XL", async ({ page, api }) => {
  api.answer("GET", "/api/progress", midRiderProgress);
  await frame(page, "XL");
  const profile = new ProfilePage(page);
  await profile.open();
  await expect(profile.meta).toHaveText("760 XP to level 8 · 4-day streak");
  await pictures(page);
  await shot(page, "profile-xl");
  api.answer("GET", "/api/progress", veteran);
  await profile.open();
  await expect(profile.meta).toHaveText("1,280 XP to level 19 · 21-day streak");
  await pictures(page);
  await shot(page, "veteran-xl");
  api.answer("GET", "/api/progress", { level: 1, totalXp: 0, nextLevelXp: 400, streakDays: 0 });
  await profile.open();
  await expect(profile.meta).toHaveText("400 XP to level 2 · 0-day streak");
  await pictures(page);
  await shot(page, "new-xl");
});

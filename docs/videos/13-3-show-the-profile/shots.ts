import { newRiderProgress } from "../../../frontend/e2e/fixtures/api";
import { ECHELON_NOTIFY, echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { midRiderProgress } from "../../../frontend/e2e/fixtures/progress";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { ProfilePage } from "../../../frontend/e2e/pages/profile.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 13.3, Show the profile, in the running app: Profile for the mocks' mid rider,
 * Sam, at 390, 768, 1024 and 1440 px with the bike connected; the headline and Settings at 1440 px; a new rider's
 * headline; and the bike row with no bike paired. The shared fixture serves the rider's progress and remembers a bike.
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/13-3-show-the-profile`.
 */

/** A `D1` frame: 5 s, no revolutions, 80 rpm (docs/protocol/echelon-ble-frames.md). */
const WORKOUT_FRAME = [0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f];

test.beforeEach(async ({ api }) => {
  api.answer("GET", "/api/riders/me", { id: "c0a8e1f2-5b3d-4e6f-9a7b-8c9d0e1f2a3b", displayName: "Sam" });
  api.answer("GET", "/api/progress", midRiderProgress);
});

/** Opens Home, which connects the remembered bike, then Profile. */
async function connected(page: import("@playwright/test").Page, bluetooth: { writes(): unknown[]; notify(uuid: string, frame: number[]): Promise<void> }): Promise<ProfilePage> {
  const home = new HomePage(page);
  await home.open();
  await expect.poll(() => bluetooth.writes().length).toBe(3);
  await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
  await home.header.link("Profile").click();
  const profile = new ProfilePage(page);
  await expect(profile.bikeRow).toHaveAccessibleName(/Connected/);
  await expect(profile.xpBar).toBeVisible();
  await pictures(page);
  return profile;
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Profile at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    await connected(page, bluetooth);
    await page.mouse.move(0, 0);
    await shot(page, `profile-${size.toLowerCase()}`);
  });
}

test("the headline and Settings at XL", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await bluetooth.remember(echelonBike);
  const profile = await connected(page, bluetooth);
  await page.mouse.move(0, 0);
  await detail(page.locator("wz-profile-level"), "headline-xl", 8);
  await detail(profile.settings, "settings-xl", 8);
});

test("a new rider with no bike, at XL", async ({ page, api }) => {
  await frame(page, "XL");
  api.answer("GET", "/api/progress", newRiderProgress);
  const profile = new ProfilePage(page);
  await profile.open();
  await expect(profile.xpBar).toBeVisible();
  await page.mouse.move(0, 0);
  await detail(page.locator("wz-profile-level"), "headline-new-xl", 8);
  await detail(profile.rows.first(), "bike-none-xl", 8);
});

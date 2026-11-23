import type { Page } from "@playwright/test";
import type { ApiFixture } from "../../../frontend/e2e/fixtures/api";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ProfilePage } from "../../../frontend/e2e/pages/profile.page";
import { SignInPage } from "../../../frontend/e2e/pages/sign-in.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 9.4, Sign out and delete account, in the running app: Profile's Settings with
 * Sign out and Delete my account, a sign-out that could not reach the backend, the delete dialog waiting for "delete"
 * and ready, a deletion that failed, and sign-in saying the account was deleted at 390, 768, 1024 and 1440 px. The
 * backend's answers come from the shared fixture's `api`, so no request leaves the machine. Not a test and not a sweep:
 * only `node tools/video-record/record.mjs docs/videos/09-4-sign-out-and-delete-account`.
 */

const UNREACHABLE = { status: 503, body: { status: 503, title: "Service unavailable." } };

const settled = (page: Page) =>
  page.waitForFunction(() => document.getAnimations().every((motion) => motion.playState !== "running"));

async function profile(page: Page, api: ApiFixture, size: Size): Promise<ProfilePage> {
  api.answer("GET", "/api/riders/me", { id: "3f2b8c1e-0d6a-4c8e-9b1f-5a7d2e9c4b10", displayName: "Sam" });
  await frame(page, size);
  const screen = new ProfilePage(page);
  await screen.open();
  await expect(screen.heading).toHaveText("Sam · Level 1");
  await pictures(page);
  return screen;
}

for (const size of ["XS", "XL"] as Size[]) {
  test(`Profile and the delete dialog at ${size}`, async ({ page, api }) => {
    const screen = await profile(page, api, size);
    await shot(page, `profile-${size.toLowerCase()}`);
    await screen.deleteAccount.click();
    await expect(screen.deleteDialog.confirmation).toBeFocused();
    await settled(page);
    await shot(page, `dialog-${size.toLowerCase()}`);
    await screen.deleteDialog.confirmation.fill("delete");
    await shot(page, `ready-${size.toLowerCase()}`);
  });
}

test("a sign-out and a deletion that fail, at XL", async ({ page, api }) => {
  api.answer("POST", "/api/auth/sign-out", () => UNREACHABLE);
  api.answer("DELETE", "/api/riders/me", () => UNREACHABLE);
  const screen = await profile(page, api, "XL");
  await screen.signOut.click();
  await expect(screen.settingsMessage).toBeVisible();
  await page.mouse.move(0, 0);
  await shot(page, "sign-out-failed-xl");
  await screen.deleteAccount.click();
  await screen.deleteDialog.confirmation.fill("delete");
  await screen.deleteDialog.delete.click();
  await expect(screen.deleteDialog.message).toBeVisible();
  await settled(page);
  await shot(page, "delete-failed-xl");
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`sign-in after a deletion at ${size}`, async ({ page, api }) => {
    api.answer("DELETE", "/api/riders/me", () => ({ status: 204 }));
    const screen = await profile(page, api, size);
    await screen.deleteAccount.click();
    await screen.deleteDialog.confirmation.fill("delete");
    await screen.deleteDialog.delete.click();
    const signIn = new SignInPage(page);
    await expect(signIn.message).toBeVisible();
    await page.mouse.move(0, 0);
    await pictures(page);
    await shot(page, `deleted-${size.toLowerCase()}`);
  });
}

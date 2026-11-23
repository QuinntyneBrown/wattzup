import type { Page } from "@playwright/test";
import type { ApiFixture } from "../../../frontend/e2e/fixtures/api";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { DisplayNamePromptPage } from "../../../frontend/e2e/pages/display-name-prompt.page";
import { ProfilePage } from "../../../frontend/e2e/pages/profile.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 9.3, Choose a display name, in the running app: the prompt at 390, 768, 1024
 * and 1440 px, a name typed, a name that breaks the rule, Profile's headline and its Display name dialog, on a desktop
 * and as a sheet on a phone. The backend's answers come from the shared fixture's `api`, so no request leaves the
 * machine. Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/09-3-choose-a-display-name`.
 */

const RIDER = "3f2b8c1e-0d6a-4c8e-9b1f-5a7d2e9c4b10";

async function prompt(page: Page, api: ApiFixture, size: Size): Promise<DisplayNamePromptPage> {
  api.answer("GET", "/api/riders/me", { id: RIDER, displayName: null });
  await frame(page, size);
  const screen = new DisplayNamePromptPage(page);
  await screen.open();
  await expect(screen.heading).toHaveText("What should other riders call you?");
  await pictures(page);
  return screen;
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the prompt at ${size}`, async ({ page, api }) => {
    await prompt(page, api, size);
    await shot(page, `prompt-${size.toLowerCase()}`);
  });
}

test("a name typed, and one that breaks the rule, at XL", async ({ page, api }) => {
  const screen = await prompt(page, api, "XL");
  await screen.name.fill("Sam");
  await shot(page, "ready-xl");
  await screen.name.fill("<b>Sam</b>");
  await screen.continue.click();
  await expect(screen.error).toBeVisible();
  await shot(page, "invalid-xl");
});

for (const size of ["XS", "XL"] as Size[]) {
  test(`Profile and its dialog at ${size}`, async ({ page, api }) => {
    api.answer("GET", "/api/riders/me", { id: RIDER, displayName: "Sam" });
    await frame(page, size);
    const profile = new ProfilePage(page);
    await profile.open();
    await expect(profile.heading).toHaveText("Sam · Level 1");
    await pictures(page);
    await shot(page, `profile-${size.toLowerCase()}`);
    await profile.displayName.click();
    await expect(profile.dialog.name).toBeFocused();
    await profile.dialog.name.fill("Sam Rider");
    await page.waitForFunction(() => document.getAnimations().every((motion) => motion.playState !== "running"));
    await shot(page, `dialog-${size.toLowerCase()}`);
  });
}

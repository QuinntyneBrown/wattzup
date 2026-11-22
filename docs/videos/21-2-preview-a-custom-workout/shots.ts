import type { Page } from "@playwright/test";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { CustomWorkoutPage } from "../../../frontend/e2e/pages/custom-workout.page";
import { type Size, detail, detailAll, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 21.2, Preview a custom workout, in the running app, through the flows of
 * e2e/custom-workout-preview.spec.ts and e2e/custom-workout-video.spec.ts: Custom workout with Your ride at 390, 768,
 * 1024 and 1440 px; Your ride close up for GCN 30-min HIIT, after round 1 is removed and for flat resistance; the video
 * section synced at 0:12.0; and a link that is not YouTube's. Only `node tools/video-record/record.mjs
 * docs/videos/21-2-preview-a-custom-workout`.
 */

async function open(page: Page, bluetooth: { remember: (bike: typeof echelonBike) => Promise<void> }) {
  await bluetooth.remember(echelonBike);
  const custom = new CustomWorkoutPage(page);
  await custom.open();
  await expect(custom.previewTotal).toHaveText("30:00");
  return custom;
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Custom workout with Your ride at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await open(page, bluetooth);
    await page.mouse.move(0, 0);
    await shot(page, `setup-${size.toLowerCase()}`);
  });
}

test("Your ride for GCN 30-min HIIT", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  const custom = await open(page, bluetooth);
  await page.mouse.move(0, 0);
  await detail(custom.preview, "preview");
});

test("Your ride after round 1 is removed", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  const custom = await open(page, bluetooth);
  await custom.ladder("Remove round 1").click();
  await expect(custom.previewTotal).toHaveText("26:30");
  await page.mouse.move(0, 0);
  await detail(custom.preview, "changed");
});

test("Your ride for flat resistance", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  const custom = await open(page, bluetooth);
  await custom.flat.click();
  await expect(custom.fact("Structure")).toHaveText("Level 12 throughout");
  await page.mouse.move(0, 0);
  await detail(custom.preview, "flat");
});

test("the video synced at 0:12.0", async ({ page, bluetooth, youtube }) => {
  await frame(page, "XL");
  const custom = await open(page, bluetooth);
  await custom.videoSwitch.click();
  await expect.poll(async () => (await youtube.players()).length).toBe(1);
  await youtube.jump(12);
  await custom.useCurrentTime.click();
  await expect(custom.fact("Video")).toHaveText("Synced from 0:12.0");
  await page.locator(".setup__settings").evaluate((settings) => settings.scrollTo(0, settings.scrollHeight));
  await page.mouse.move(0, 0);
  await shot(page, "video");
});

test("a link that is not YouTube's", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  const custom = await open(page, bluetooth);
  await custom.videoSwitch.click();
  await custom.videoLink.fill("https://vimeo.com/76979871");
  await expect(custom.videoLinkError).toBeVisible();
  await page.mouse.move(0, 0);
  await detailAll([page.locator(".video-sync__label"), custom.videoLinkError], "invalid", 24);
});

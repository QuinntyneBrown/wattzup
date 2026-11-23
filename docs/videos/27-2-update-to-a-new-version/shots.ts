import { appCached } from "../../../frontend/e2e/fixtures/app-cache";
import { startCustomRide } from "../../../frontend/e2e/fixtures/custom-ride";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { AppUpdate } from "../../../frontend/e2e/pages/app-update";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { type Size, SIZES, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 27.2, Update to a new version, in the running app with its real service worker,
 * through the page objects of e2e/app-update.spec.ts: Home offering a new version at 390, 768, 1024 and 1440 px and a
 * close-up of the toast; a custom ride with the new version ready and no toast; and Profile with the toast once End is
 * pressed. A new version is the build's ngsw.json with a change the worker sees, as in the spec. Not a test: only
 * `node tools/video-record/record.mjs docs/videos/27-2-update-to-a-new-version`.
 */

test.use({ serviceWorkers: "allow" });

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Home offers a new version at ${SIZES[size].width} px`, async ({ page, context }) => {
    await frame(page, size);
    const home = new HomePage(page);
    const update = new AppUpdate(page);
    await home.open();
    await expect(home.greeting).toBeVisible();
    await appCached(page);
    await page.reload();
    await expect(home.greeting).toBeVisible();
    await update.deploy(context);
    await update.checkNow();
    await expect(update.toast).toBeVisible();
    await page.mouse.move(0, 0);
    await shot(page, `home-${size.toLowerCase()}`);
    if (size === "XL") await detail(update.toast, "toast", 0);
  });
}

test("a ride holds the new version, and Profile offers it", async ({ page, context, bluetooth }) => {
  await frame(page, "XL");
  const home = new HomePage(page);
  const update = new AppUpdate(page);
  await home.open();
  await expect(home.greeting).toBeVisible();
  await appCached(page);
  const ride = await startCustomRide(page, bluetooth);
  // The ride runs on the real clock from here, so the screenshots' animation frames come.
  await page.clock.resume();
  await page.clock.runFor(6000);
  await update.deploy(context);
  await update.checkNow();
  await page.clock.runFor(1000);
  await expect(update.toast).toBeHidden();
  await page.mouse.move(0, 0);
  await shot(page, "ride-held-xl");
  await ride.end.click();
  await page.clock.runFor(100);
  await expect(update.toast).toBeVisible();
  await page.mouse.move(0, 0);
  await shot(page, "profile-offer-xl");
});

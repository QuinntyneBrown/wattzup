import { ECHELON_NOTIFY, echelonBike, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import { shortTrials } from "../../../frontend/e2e/fixtures/device-check";
import { stepUntil } from "../../../frontend/e2e/fixtures/race";
import { storeSettings } from "../../../frontend/e2e/fixtures/settings-storage";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { RacePage } from "../../../frontend/e2e/pages/race.page";
import { SettingsPage } from "../../../frontend/e2e/pages/settings.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 20.3, Check this device, in the running app, through the flows of
 * e2e/device-check.spec.ts: the World section with a check's result at 390, 768, 1024 and 1440 px; the check before it
 * runs, while it tries Medium after High held 33 fps (2-second trials, frames stepped on the paused clock), and
 * finished; and a solo race at 1920 × 1080 whose world opened where the check found. Only
 * `node tools/video-record/record.mjs docs/videos/20-3-check-this-device`. The running check comes last: the shot after it
 * failed to load its page or its world while the check's software-drawn frames were still being let go.
 */

const CHECKED_AT = new Date("2026-11-22T19:31:00Z");
const RESULT = JSON.stringify({
  deviceCheck: {
    level: "medium",
    displayFps: 60,
    tried: [{ level: "high", fps: 33 }],
    checkedAt: CHECKED_AT.toISOString(),
  },
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the World section with a check's result at ${size}`, async ({ page, bluetooth, webgl }) => {
    await frame(page, size);
    await webgl.withoutWebGpu();
    await page.clock.setFixedTime(CHECKED_AT);
    await storeSettings(page, RESULT);
    await bluetooth.remember(echelonBike);
    const settings = new SettingsPage(page);
    await settings.open("world");
    await expect(settings.checkResult).toBeVisible({ timeout: 30_000 });
    await settings.graphics.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await shot(page, `check-${size.toLowerCase()}`);
  });
}

test("the check before it runs", async ({ page, bluetooth, webgl }) => {
  await frame(page, "XL");
  await webgl.withoutWebGpu();
  await bluetooth.remember(echelonBike);
  const settings = new SettingsPage(page);
  await settings.open("world");
  await expect(settings.check).toBeVisible({ timeout: 30_000 });
  await page.mouse.move(0, 0);
  await detail(page.locator("wz-device-check"), "check-idle");
});

test("the check finished", async ({ page, bluetooth, webgl }) => {
  await frame(page, "XL");
  await webgl.withoutWebGpu();
  await page.clock.setFixedTime(CHECKED_AT);
  await storeSettings(page, RESULT);
  await bluetooth.remember(echelonBike);
  const settings = new SettingsPage(page);
  await settings.open("world");
  await expect(settings.checkResult).toBeVisible({ timeout: 30_000 });
  await page.mouse.move(0, 0);
  await detail(page.locator("wz-device-check"), "check-done");
});

test("a race whose world opens where the check found", async ({ page, bluetooth, webgl }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await webgl.withoutWebGpu();
  await storeSettings(page, RESULT);
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open("old-town-criterium", "mode=solo");
  await expect(race.backend).toBeVisible({ timeout: 60_000 });
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
  await page.mouse.move(0, 0);
  await shot(page, "race-checked");
});

test("the check trying Medium after High held 33 fps", async ({ page, bluetooth, webgl }) => {
  test.setTimeout(240_000);
  await frame(page, "XL");
  await webgl.withoutWebGpu();
  await shortTrials(page, 2);
  await bluetooth.remember(echelonBike);
  await page.clock.install({ time: CHECKED_AT });
  await page.clock.pauseAt(CHECKED_AT);
  const settings = new SettingsPage(page);
  await settings.open("world");
  await stepUntil(page, () => expect(settings.check).toBeVisible({ timeout: 50 }));
  await settings.check.click();
  const frames = async (ms: number, shown: () => Promise<void>) =>
    expect(async () => {
      await page.clock.fastForward(ms);
      await shown();
    }).toPass({ intervals: [0], timeout: 150_000 });
  await frames(16, () => expect(settings.checkPercent).not.toHaveText("0%", { timeout: 50 }));
  await frames(30, () => expect(settings.checkLabel).toHaveText("Trying Medium · 2 s left", { timeout: 50 }));
  await frames(16, () => expect(settings.checkLabel).toHaveText("Trying Medium · 1 s left", { timeout: 50 }));
  await page.mouse.move(0, 0);
  // The capture waits for two frames, which the paused clock gives one step at a time (L199).
  let taken = false;
  const capture = detail(page.locator("wz-device-check"), "check-running").finally(() => (taken = true));
  while (!taken) await page.clock.fastForward(16);
  await capture;
});

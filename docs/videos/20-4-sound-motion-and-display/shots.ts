import type { Page } from "@playwright/test";
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import { startRace } from "../../../frontend/e2e/fixtures/race";
import { storeSettings } from "../../../frontend/e2e/fixtures/settings-storage";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { SettingsPage } from "../../../frontend/e2e/pages/settings.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 20.4, Sound, motion and display, in the running app, through the flows of
 * e2e/settings-sound-display.spec.ts: Settings' Sound and Motion and display at 390, 768, 1024 and 1440 px; each
 * section close up, with this device asking for reduced motion as the recorder's window does; Settings in the light
 * theme; and a race on a phone with Standard and with Large ride numbers, over its panorama. Only
 * `node tools/video-record/record.mjs docs/videos/20-4-sound-motion-and-display`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Sound and Motion and display at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const settings = new SettingsPage(page);
    await settings.open("sound");
    await expect(settings.rideSound).toBeVisible({ timeout: 30_000 });
    await settings.section("Sound").evaluate((section) => section.scrollIntoView());
    await page.mouse.move(0, 0);
    await shot(page, `settings-${size.toLowerCase()}`);
  });
}

test("Sound close up", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await storeSettings(page, JSON.stringify({ rideSoundVolume: 55 }));
  await bluetooth.remember(echelonBike);
  const settings = new SettingsPage(page);
  await settings.open("sound");
  await expect(settings.volumeValue).toHaveText("55 %", { timeout: 30_000 });
  await page.mouse.move(0, 0);
  await detail(page.locator("wz-sound-settings"), "sound");
});

test("Motion and display close up", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await storeSettings(page, JSON.stringify({ rideNumbers: "large", fullScreenOnStart: true }));
  await bluetooth.remember(echelonBike);
  const settings = new SettingsPage(page);
  await settings.open("display");
  await expect(settings.reduceMotionHint).toContainText("This device asks for it.", { timeout: 30_000 });
  await page.mouse.move(0, 0);
  await detail(page.locator("wz-display-settings"), "display");
});

test("Settings in the light theme", async ({ page, bluetooth }) => {
  await frame(page, "XL", "light");
  await bluetooth.remember(echelonBike);
  const settings = new SettingsPage(page);
  await settings.open("display");
  await expect(settings.theme).toBeVisible({ timeout: 30_000 });
  await page.mouse.move(0, 0);
  await shot(page, "light-xl");
});

/**
 * A screenshot settles on two animation frames, which the paused clock holds back, so the clock steps one 16 ms frame
 * for each 50 ms of real time until it is taken (as in the film of slice 7.3).
 */
async function still(page: Page, take: () => Promise<void>): Promise<void> {
  let done = false;
  const taken = take().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
}

for (const numbers of ["standard", "large"]) {
  test(`a race on a phone with ${numbers} ride numbers`, async ({ page, bluetooth, api }) => {
    test.setTimeout(120_000);
    await frame(page, "XS");
    await storeSettings(page, JSON.stringify({ rideNumbers: numbers }));
    const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=solo");
    // The warm-up at 80 rpm on level 8 (143 W); cadence is sent every 4 s, inside its 5-second timeout.
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(8));
    for (let second = 0; second < 12; second += 4) {
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
      await page.clock.runFor(4000);
    }
    await expect(race.wattsValue).not.toHaveText("—");
    await page.mouse.move(0, 0);
    await still(page, () => shot(page, `race-${numbers}`));
  });
}

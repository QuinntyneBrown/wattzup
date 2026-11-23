import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { CustomWorkoutPage } from "../../../frontend/e2e/pages/custom-workout.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 21.1, Set up a custom workout, in the running app, through the flows of
 * e2e/custom-workout-setup.spec.ts: Custom workout on GCN 30-min HIIT at 390, 768, 1024 and 1440 px; the ladder close
 * up after round 1's effort went to 0:35 and round 2's recovery to 2:15; Tabata chosen; the level sliders and steppers
 * close up; and flat resistance at 1440 and 390 px. Only `node tools/video-record/record.mjs
 * docs/videos/21-1-set-up-a-custom-workout`.
 */

async function open(page: import("@playwright/test").Page, bluetooth: { remember: (bike: typeof echelonBike) => Promise<void> }) {
  await bluetooth.remember(echelonBike);
  const custom = new CustomWorkoutPage(page);
  await custom.open();
  await expect(custom.rounds).toHaveCount(8);
  return custom;
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Custom workout at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await open(page, bluetooth);
    await page.mouse.move(0, 0);
    await shot(page, `setup-${size.toLowerCase()}`);
  });
}

test("the ladder after the rider's edits", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  const custom = await open(page, bluetooth);
  await custom.ladder("Longer effort 1").click();
  await custom.ladder("Shorter recovery 2").click();
  await expect(custom.plan("GCN 30-min HIIT · edited")).toBeVisible();
  await page.mouse.move(0, 0);
  await detail(page.locator(".setup__section"), "ladder");
});

test("Tabata chosen", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  const custom = await open(page, bluetooth);
  await custom.plan("Tabata").click();
  await expect(custom.ladderTitle).toHaveText("Tabata · Telo Ride");
  await page.mouse.move(0, 0);
  await shot(page, "tabata");
});

test("the levels, warm-up and cool-down", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await open(page, bluetooth);
  await page.locator(".setup__levels").scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await detail(page.locator(".setup__levels, .setup__steppers").first(), "levels");
});

for (const size of ["XL", "XS"] as Size[]) {
  test(`flat resistance at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    const custom = await open(page, bluetooth);
    await custom.flat.click();
    await expect(custom.flatLevelValue).toHaveText("12 / 32");
    await page.mouse.move(0, 0);
    await shot(page, `flat-${size.toLowerCase()}`);
  });
}

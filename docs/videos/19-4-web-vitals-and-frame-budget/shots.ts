import { ECHELON_NOTIFY, echelonBike, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { frameRun } from "../../../frontend/e2e/perf/frames";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { RacePage } from "../../../frontend/e2e/pages/race.page";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 19.4, Web vitals and frame budget, in the running app, through the flows the
 * performance checks take without their thresholds: Home at 390, 768, 1024 and 1440 px, after the rider's first Tab and
 * tap; and a solo race opened on the real clock at 1920 × 1080, drawing its world while the page records three seconds
 * of frames. The checks themselves run only when a person asks, on the device measured; these are not they. Only
 * `node tools/video-record/record.mjs docs/videos/19-4-web-vitals-and-frame-budget`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Home after the first Tab and a tap, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const home = new HomePage(page);
    await home.open();
    await expect(home.main).toBeAttached();
    await page.waitForLoadState("networkidle");
    await page.keyboard.press("Tab");
    await expect(home.skipLink).toBeFocused();
    await home.main.click({ position: { x: 8, y: 8 } });
    await page.mouse.move(0, 0);
    await shot(page, `home-${size.toLowerCase()}`);
  });
}

test("a race on the real clock at 1920 × 1080, recording its frames", async ({ page, bluetooth, webgl }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await webgl.withoutWebGpu();
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open("old-town-criterium", "mode=solo");
  await expect(race.backend).toBeVisible({ timeout: 60_000 });
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
  const intervals = await page.evaluate(
    (measured) =>
      new Promise<number[]>((resolve) => {
        const seen: number[] = [];
        let last = performance.now();
        const end = last + measured;
        const step = (now: number) => {
          seen.push(now - last);
          last = now;
          if (now < end) requestAnimationFrame(step);
          else resolve(seen);
        };
        requestAnimationFrame(step);
      }),
    3_000,
  );
  expect(frameRun(intervals).averageFps).toBeGreaterThan(0);
  await page.mouse.move(0, 0);
  await shot(page, "race-1920");
});

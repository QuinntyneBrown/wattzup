// Performance check, run only when a person asks (`npm run perf -- --headed` on the reference laptop)
// Traces to: L2-136 AC3; L2-159 AC4
// Description: a race at 1920 × 1080 draws its world at 50 frames a second on average and never below 30 for more than
// one second, quality stepping down before the frame rate does. The race opens on the real clock (Playwright's clock
// would stand in for requestAnimationFrame), the fake bike notifying each second, and the page records a minute of
// frame intervals once the world is drawn. Real time is the measure, so the check waits on it.
import { ECHELON_NOTIFY, echelonBike, workoutFrame } from '../fixtures/echelon';
import { expect, test } from '../fixtures/test';
import { RacePage } from '../pages/race.page';
import { frameRun } from './frames';

const MEASURED_MS = 60_000;

test.use({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

test('a race at 1920 × 1080 holds 50 frames a second, never below 30 for over a second (L2-136 AC3)', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open('old-town-criterium', 'mode=solo');
  await expect(race.backend).toBeVisible({ timeout: 60_000 });

  let riding = true;
  const pedalling = (async () => {
    while (riding) {
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
      await page.waitForTimeout(1_000);
    }
  })();
  const intervals = await page.evaluate(
    (measured) =>
      new Promise<number[]>((resolve) => {
        const seen: number[] = [];
        let last = performance.now();
        const end = last + measured;
        const frame = (now: number) => {
          seen.push(now - last);
          last = now;
          if (now < end) requestAnimationFrame(frame);
          else resolve(seen);
        };
        requestAnimationFrame(frame);
      }),
    MEASURED_MS,
  );
  riding = false;
  await pedalling;

  const run = frameRun(intervals);
  test.info().annotations.push({
    type: 'frames',
    description: `${await race.backend.textContent()}: ${run.averageFps.toFixed(1)} fps on average, ${Math.round(run.longestBelow30Ms)} ms at most below 30`,
  });
  expect(
    run.averageFps,
    `${run.averageFps.toFixed(1)} frames a second on average`,
  ).toBeGreaterThanOrEqual(50);
  expect(
    run.longestBelow30Ms,
    `${Math.round(run.longestBelow30Ms)} ms below 30 frames a second`,
  ).toBeLessThanOrEqual(1_000);
});

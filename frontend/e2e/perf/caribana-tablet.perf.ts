import { newRiderProgress } from '../fixtures/api';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { maps } from '../fixtures/maps';
import { expect, test } from '../fixtures/test';
import { RacePage } from '../pages/race.page';
import { frameRun } from './frames';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true,
});

test('Caribana keeps the simulated tablet ride moving at a nominal 60 Hz', async ({
  page,
  bluetooth,
  api,
  worldRide,
}) => {
  const id = 'caribana-parade';
  api.answer('GET', '/api/maps', [
    {
      ...maps[1],
      id,
      world: 'caribana',
      name: 'Caribana Parade',
      routeName: 'Lake Shore Boulevard',
      realPlace: undefined,
      unlockGoal: null,
      unlockMapId: null,
    },
  ]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [id] });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const assets = Promise.all(
    ['rider.glb', 'caribana-tablet.glb'].map((name) =>
      page.waitForResponse((response) => response.url().endsWith('/' + name) && response.ok(), {
        timeout: 90_000,
      }),
    ),
  );
  await race.open(id, 'mode=solo');
  await assets;
  await expect(race.backend).toBeVisible({ timeout: 90_000 });
  let riding = true;
  const pedalling = (async () => {
    while (riding) {
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
      await page.waitForTimeout(500);
    }
  })();
  try {
    await page.waitForTimeout(9_000);
    const startDistance = await race.distance.textContent();
    const intervals = await page.evaluate(
      () =>
        new Promise<number[]>((done) => {
          const intervals: number[] = [];
          let first = 0;
          let previous = 0;
          function frame(now: number) {
            if (previous) intervals.push(now - previous);
            else first = now;
            previous = now;
            if (now - first >= 60_000) done(intervals);
            else requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        }),
    );
    expect(await race.distance.textContent()).not.toBe(startDistance);
    expect((await worldRide.report())?.drawCalls).toBeGreaterThan(0);
    const { averageFps } = frameRun(intervals);
    const sorted = [...intervals].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(0.95 * sorted.length)]!;
    test.info().annotations.push({
      type: 'frames',
      description:
        averageFps.toFixed(2) +
        ' FPS, p95 ' +
        p95.toFixed(2) +
        ' ms, longest ' +
        sorted.at(-1)!.toFixed(2) +
        ' ms',
    });
    expect(Math.round(averageFps)).toBeGreaterThanOrEqual(60);
  } finally {
    riding = false;
    await pedalling;
  }
});

import { newRiderProgress } from '../fixtures/api';
import { brooklynCourseMap } from '../fixtures/course';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { expect, test } from '../fixtures/test';
import { RacePage } from '../pages/race.page';
import { frameRun } from './frames';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

for (const [section, offsetMetres] of [
  ['Gothic tower and commuters', 1120],
  ['Traffic and ferries at midspan', 1520],
] as const) {
  test(
    'Brooklyn Bridge Commute sustains 60 FPS through the ' + section,
    async ({ page, browser, bluetooth, api, worldRide }, info) => {
      const map = brooklynCourseMap;
      api.answer('GET', '/api/maps', [map]);
      api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [map.id] });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await worldRide.pin('low', 'webgl2');
      await bluetooth.remember(echelonBike);
      const race = new RacePage(page);
      const assets = Promise.all(
        ['brooklyn.glb', 'brooklyn.course.json', 'rider.glb'].map((file) =>
          page.waitForResponse((r) => r.url().endsWith('/' + file) && r.ok()),
        ),
      );
      await race.open(map.id, 'mode=solo');
      await assets;
      if (offsetMetres) {
        await page.evaluate((from) => {
          (window as unknown as { __wzWorldRide: { from: number } }).__wzWorldRide.from = from;
        }, offsetMetres);
      }
      await expect(race.backend).toBeVisible();
      let active = true;
      const pedal = (async () => {
        while (active) {
          await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
          await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
          await page.waitForTimeout(500);
        }
      })();
      try {
        await page.waitForTimeout(9000);
        const before = await race.distance.textContent();
        // CourseRenderer publishes the pinned course report immediately after each render.
        // Sample that publication so skipping a world draw cannot appear as a successful frame.
        const { intervals, displayIntervals, maxDrawCalls, backend } = await page.evaluate(
          async () => {
            type Report = { drawCalls: number; backend: string };
            const hook = (window as unknown as { __wzWorldRide: { course: Report } }).__wzWorldRide;
            let latest = hook.course;
            const start = performance.now();
            let previous = start;
            let maxDrawCalls = 0;
            const intervals: number[] = [];
            Object.defineProperty(hook, 'course', {
              configurable: true,
              get: () => latest,
              set(value: Report) {
                latest = value;
                const now = performance.now();
                intervals.push(now - previous);
                previous = now;
                maxDrawCalls = Math.max(maxDrawCalls, value.drawCalls);
              },
            });
            const displayIntervals: number[] = [];
            let previousTick = 0;
            try {
              await new Promise<void>((resolve) => {
                function tick(now: number) {
                  if (previousTick) displayIntervals.push(now - previousTick);
                  previousTick = now;
                  if (now - start >= 60000) resolve();
                  else requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
              });
              intervals.push(performance.now() - previous);
            } finally {
              Object.defineProperty(hook, 'course', {
                configurable: true,
                writable: true,
                value: latest,
              });
            }
            return { intervals, displayIntervals, maxDrawCalls, backend: latest.backend };
          },
        );
        // Include any stall at either end. The two partial intervals span one frame interval together.
        intervals[0] += intervals.pop()!;
        const { averageFps } = frameRun(intervals);
        const sorted = intervals.sort((a, b) => a - b);
        const result = {
          section,
          offsetMetres,
          averageFps,
          displayFps: frameRun(displayIntervals).averageFps,
          p95Ms: sorted[Math.floor(sorted.length * 0.95)],
          longestMs: sorted.at(-1),
          maxDrawCalls,
          backend,
          browser: browser.version(),
          platform: process.platform,
          arch: process.arch,
          fromKm: before,
          toKm: await race.distance.textContent(),
        };
        await info.attach('tablet-frames', {
          body: JSON.stringify(result, null, 2),
          contentType: 'application/json',
        });
        console.log(JSON.stringify(result));
        expect(result.toKm).not.toBe(before);
        expect(backend).toBe('webgl2');
        expect(maxDrawCalls).toBeGreaterThan(0);
        expect(Math.round(result.displayFps)).toBeGreaterThanOrEqual(60);
        expect(Math.round(averageFps)).toBeGreaterThanOrEqual(60);
      } finally {
        active = false;
        await pedal;
        await cdp.detach();
      }
    },
  );
}

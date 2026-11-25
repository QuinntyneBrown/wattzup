// L2-064. Water drops into McWay Cove and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { bigSurCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('the waterfall drops into McWay Cove and holds on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [bigSurCourseMap]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [bigSurCourseMap.id] });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(5740);
  const row = maps.row(bigSurCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.fallingWater();
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.09);
  const surf = await worldRide.surfCrest();
  await expect.poll(() => worldRide.surfCrest()).not.toBe(surf);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const stillSurf = await worldRide.surfCrest();
  const held = await worldRide.fallingWater();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.fallingWater()).toBe(held);
  expect(await worldRide.surfCrest()).toBe(stillSurf);
  await race.resume.click();
  await expect.poll(() => worldRide.fallingWater()).not.toBe(held);
});

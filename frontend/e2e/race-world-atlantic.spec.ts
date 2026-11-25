// L2-064. Sea spray rises beside the causeway and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { atlanticRoadCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('the breaking swell throws spray above the wet rocks and holds on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [atlanticRoadCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [atlanticRoadCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(962);
  const row = maps.row(atlanticRoadCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.sprayHeight();
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.09);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const held = await worldRide.sprayHeight();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.sprayHeight()).toBe(held);
  await race.resume.click();
  await expect.poll(() => worldRide.sprayHeight()).not.toBe(held);
});

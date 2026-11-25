// L2-065. The Val Gardena cabin follows the ride clock.
import { newRiderProgress } from './fixtures/api';
import { dolomitesCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('the Val Gardena gondola travels above the road, holds on pause and resumes', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [dolomitesCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [dolomitesCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(15100);
  const row = maps.row(dolomitesCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();

  await expect.poll(() => worldRide.cabinHeight()).not.toBeNull();
  const first = await worldRide.cabinHeight();
  await expect.poll(() => worldRide.cabinHeight()).not.toBe(first);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const held = await worldRide.cabinHeight();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.cabinHeight()).toBe(held);
  await race.resume.click();
  await expect.poll(() => worldRide.cabinHeight()).not.toBe(held);
});

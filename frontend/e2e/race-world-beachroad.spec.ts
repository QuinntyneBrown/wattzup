// L2-064. The club bunch changes its working line and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { beachRoadCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('a club cyclist rotates through the working line and holds on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [beachRoadCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [beachRoadCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(1650);
  const row = maps.row(beachRoadCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.clubLane();
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.09);
  await expect.poll(() => worldRide.eveningLight()).toBe(0);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const held = await worldRide.clubLane();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.clubLane()).toBe(held);
  await race.resume.click();
  await expect.poll(() => worldRide.clubLane()).not.toBe(held);
  await worldRide.startAt(18660);
  await expect.poll(() => worldRide.eveningLight()).toBeGreaterThan(0.8);
});

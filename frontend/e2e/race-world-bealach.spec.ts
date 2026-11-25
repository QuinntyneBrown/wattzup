// L2-064. A sheep steps aside on the Applecross road and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { bealachCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('a sheep steps aside near the riding line and holds still on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [bealachCourseMap]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [bealachCourseMap.id] });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(3120);
  const row = maps.row(bealachCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const firstSun = await worldRide.highlandSun();
  expect(firstSun).toBeGreaterThan(0);
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.sheepLane();
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.09);
  await expect.poll(() => worldRide.highlandSun()).not.toBe(firstSun);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const shade = await worldRide.highlandSun();
  const held = await worldRide.sheepLane();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.highlandSun()).toBe(shade);
  expect(await worldRide.sheepLane()).toBe(held);
  await race.resume.click();
  await expect.poll(() => worldRide.sheepLane()).not.toBe(held);
});

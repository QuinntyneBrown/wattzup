// L2-064. Mist crosses the coffee road and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { blueMountainsCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('the mist drifts across Roots Yard as its speakers pulse and holds on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [blueMountainsCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [blueMountainsCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(1510);
  const row = maps.row(blueMountainsCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.yardMotion('mistPosition');
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.09);
  const cone = await worldRide.yardMotion('speakerDepth');
  await expect.poll(() => worldRide.yardMotion('speakerDepth')).not.toBe(cone);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const stillCone = await worldRide.yardMotion('speakerDepth');
  const held = await worldRide.yardMotion('mistPosition');
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.yardMotion('mistPosition')).toBe(held);
  expect(await worldRide.yardMotion('speakerDepth')).toBe(stillCone);
  await race.resume.click();
  await expect.poll(() => worldRide.yardMotion('mistPosition')).not.toBe(held);
});

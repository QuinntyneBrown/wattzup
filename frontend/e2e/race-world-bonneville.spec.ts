// L2-064. The crew pushes a streamliner down the staging lane and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { bonnevilleCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('the Speed Week push car and the heat shimmer move with the race and hold on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [bonnevilleCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [bonnevilleCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(676);
  const row = maps.row(bonnevilleCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.saltMotion('pushCarPosition');
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.09);
  const mirage = await worldRide.saltMotion('mirageHeight');
  await expect.poll(() => worldRide.saltMotion('mirageHeight')).not.toBe(mirage);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const stillMirage = await worldRide.saltMotion('mirageHeight');
  const held = await worldRide.saltMotion('pushCarPosition');
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.saltMotion('pushCarPosition')).toBe(held);
  expect(await worldRide.saltMotion('mirageHeight')).toBe(stillMirage);
  await race.resume.click();
  await expect.poll(() => worldRide.saltMotion('pushCarPosition')).not.toBe(held);
});

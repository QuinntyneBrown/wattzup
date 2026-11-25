// L2-064. The mill wheel turns beside the pond and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { blueRidgeCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('Mabry Mill turns beside the pond and the valley mist holds on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [blueRidgeCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [blueRidgeCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(6155);
  const row = maps.row(blueRidgeCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.millMotion('paddleHeight');
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.09);
  const mist = await worldRide.millMotion('valleyMist');
  await expect.poll(() => worldRide.millMotion('valleyMist')).not.toBe(mist);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const stillMist = await worldRide.millMotion('valleyMist');
  const held = await worldRide.millMotion('paddleHeight');
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.millMotion('paddleHeight')).toBe(held);
  expect(await worldRide.millMotion('valleyMist')).toBe(stillMist);
  await race.resume.click();
  await expect.poll(() => worldRide.millMotion('paddleHeight')).not.toBe(held);
});

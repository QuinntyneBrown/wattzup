// L2-064. A local training group climbs outside Girona with the race clock.
import { newRiderProgress } from './fixtures/api';
import { angelsCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('the Girona training group rides along the course', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [angelsCourseMap]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [angelsCourseMap.id] });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  const row = maps.row(angelsCourseMap.name);
  await expect.poll(() => row.thumbnailDrawn()).toBe(true);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.trainingRiderX();
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.4);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const held = await worldRide.trainingRiderX();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.trainingRiderX()).toBe(held);
  await race.resume.click();
  await expect.poll(() => worldRide.trainingRiderX()).not.toBe(held);
});

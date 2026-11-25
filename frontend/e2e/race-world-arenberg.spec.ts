// L2-064. A commissaire moto follows the race clock on the cobbles.
import { newRiderProgress } from './fixtures/api';
import { arenbergCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('the commissaire moto moves up the forest road and holds on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [arenbergCourseMap]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [arenbergCourseMap.id] });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  const row = maps.row(arenbergCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.commissaireX();
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.4);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const held = await worldRide.commissaireX();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.commissaireX()).toBe(held);
  await race.resume.click();
  await expect.poll(() => worldRide.commissaireX()).not.toBe(held);
});

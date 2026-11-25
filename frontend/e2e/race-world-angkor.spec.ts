// L2-064. A tuk-tuk travels on Temple Road with the race clock.
import { newRiderProgress } from './fixtures/api';
import { angkorCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('a tuk-tuk travels along Temple Road', async ({ api, bluetooth, page, worldRide }) => {
  api.answer('GET', '/api/maps', [angkorCourseMap]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [angkorCourseMap.id] });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  const row = maps.row(angkorCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.tukTukX();
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.4);
});

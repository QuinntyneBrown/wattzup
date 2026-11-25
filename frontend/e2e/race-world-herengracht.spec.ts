// L2-064. The tour boat travels along the Herengracht with the race clock.
import { newRiderProgress } from './fixtures/api';
import { amsterdamCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { RacePage } from './pages/race.page';

test('a glass-roofed tour boat passes along the Herengracht', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [amsterdamCourseMap]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [amsterdamCourseMap.id] });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open(amsterdamCourseMap.id, 'mode=solo');
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.tourBoatX();
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.4);
});

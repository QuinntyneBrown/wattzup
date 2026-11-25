// L2-064. A local training group climbs outside Girona with the race clock.
import { newRiderProgress } from './fixtures/api';
import { angelsCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
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
  await race.open(angelsCourseMap.id, 'mode=solo');
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.trainingRiderX();
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.4);
});

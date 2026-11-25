// L2-064. The Algarve boats rise on the swell with the race clock.
import { newRiderProgress } from './fixtures/api';
import { algarveCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { RacePage } from './pages/race.page';

test('the moored fishing boats move on the Algarve cove', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [algarveCourseMap]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [algarveCourseMap.id] });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open(algarveCourseMap.id, 'mode=solo');
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const height = await worldRide.boatHeight();
      if (height !== null) samples.push(height);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.05);
});

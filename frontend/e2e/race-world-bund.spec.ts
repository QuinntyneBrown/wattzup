// L2-064. The cruise boat passes the promenade and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { bundCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('the Huangpu cruise boat and promenade tourists move with the race and hold on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [bundCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [bundCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(810);
  const row = maps.row(bundCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.bundMotion('boatPosition');
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.09);
  const tourist = await worldRide.bundMotion('touristPosition');
  await expect.poll(() => worldRide.bundMotion('touristPosition')).not.toBe(tourist);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const heldTourist = await worldRide.bundMotion('touristPosition');
  const held = await worldRide.bundMotion('boatPosition');
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.bundMotion('boatPosition')).toBe(held);
  expect(await worldRide.bundMotion('touristPosition')).toBe(heldTourist);
  await race.resume.click();
  await expect.poll(() => worldRide.bundMotion('boatPosition')).not.toBe(held);
});

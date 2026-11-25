// L2-064. The yellow cab crosses the lower deck and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { brooklynCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('bridge traffic and the East River ferry move with the race and hold on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [brooklynCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [brooklynCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(1530);
  const row = maps.row(brooklynCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.brooklynMotion('cabPosition');
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.09);
  const ferry = await worldRide.brooklynMotion('ferryPosition');
  await expect.poll(() => worldRide.brooklynMotion('ferryPosition')).not.toBe(ferry);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const stillFerry = await worldRide.brooklynMotion('ferryPosition');
  const held = await worldRide.brooklynMotion('cabPosition');
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.brooklynMotion('cabPosition')).toBe(held);
  expect(await worldRide.brooklynMotion('ferryPosition')).toBe(stillFerry);
  await race.resume.click();
  await expect.poll(() => worldRide.brooklynMotion('cabPosition')).not.toBe(held);
});

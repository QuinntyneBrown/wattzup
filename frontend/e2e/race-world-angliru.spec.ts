// L2-064. The flag at the lower climb flutters with the race clock.
import { newRiderProgress } from './fixtures/api';
import { angliruCourseMap } from './fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame, echelonBike } from './fixtures/echelon';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('the Asturian flag flutters beside the climb and rests on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [angliruCourseMap]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [angliruCourseMap.id] });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  const row = maps.row(angliruCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const angle = await worldRide.asturiasFlagAngle();
      if (angle !== null) samples.push(angle);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.07);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const held = await worldRide.asturiasFlagAngle();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.asturiasFlagAngle()).toBe(held);
  await race.resume.click();
  await expect.poll(() => worldRide.asturiasFlagAngle()).not.toBe(held);
});

test('the route panel reaches 23.5% on the concrete ramp by ridden distance', async ({
  page,
  bluetooth,
  api,
}) => {
  const race = await startRace(page, bluetooth, api, angliruCourseMap.id, 'mode=solo', {
    catalogue: [angliruCourseMap],
  });
  await expect(race.grade).toHaveText('+3.2%');
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
  for (let second = 0; second < 1300; second++) {
    if (parseFloat((await race.distance.textContent())!) >= 14.94) break;
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
    await page.clock.fastForward(1000);
  }
  await expect(race.grade).toHaveText('+23.5%');
});

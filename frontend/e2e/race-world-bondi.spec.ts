// L2-064. Surf rolls onto the sandstone ledge and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { bondiCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('Sydney walkers share the boardwalk above moving surf and both hold on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [bondiCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [bondiCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(4450);
  const row = maps.row(bondiCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.coastalMotion('foamAdvance');
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.09);
  const stride = await worldRide.coastalMotion('walkerStride');
  await expect.poll(() => worldRide.coastalMotion('walkerStride')).not.toBe(stride);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const stillStride = await worldRide.coastalMotion('walkerStride');
  const held = await worldRide.coastalMotion('foamAdvance');
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.coastalMotion('foamAdvance')).toBe(held);
  expect(await worldRide.coastalMotion('walkerStride')).toBe(stillStride);
  await race.resume.click();
  await expect.poll(() => worldRide.coastalMotion('foamAdvance')).not.toBe(held);
});

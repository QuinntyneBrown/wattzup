// L2-064. The colour guard waves a Progress Pride flag and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { brightonCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('the Pride flag and seafront float move with the race and hold on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [brightonCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [brightonCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(850);
  const row = maps.row(brightonCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.brightonMotion('bannerTip');
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.09);
  const float = await worldRide.brightonMotion('floatPosition');
  await expect.poll(() => worldRide.brightonMotion('floatPosition')).not.toBe(float);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const heldFloat = await worldRide.brightonMotion('floatPosition');
  const held = await worldRide.brightonMotion('bannerTip');
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.brightonMotion('bannerTip')).toBe(held);
  expect(await worldRide.brightonMotion('floatPosition')).toBe(heldFloat);
  await race.resume.click();
  await expect.poll(() => worldRide.brightonMotion('bannerTip')).not.toBe(held);
});

// L2-064. The starter waves the chequered flag and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { brickyardCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('the starter’s flag and infield balloons move with the race and hold on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [brickyardCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [brickyardCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(3960);
  const row = maps.row(brickyardCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.brickyardMotion('flagTip');
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.09);
  const balloon = await worldRide.brickyardMotion('balloonHeight');
  await expect.poll(() => worldRide.brickyardMotion('balloonHeight')).not.toBe(balloon);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const stillBalloon = await worldRide.brickyardMotion('balloonHeight');
  const held = await worldRide.brickyardMotion('flagTip');
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.brickyardMotion('flagTip')).toBe(held);
  expect(await worldRide.brickyardMotion('balloonHeight')).toBe(stillBalloon);
  await race.resume.click();
  await expect.poll(() => worldRide.brickyardMotion('flagTip')).not.toBe(held);
});

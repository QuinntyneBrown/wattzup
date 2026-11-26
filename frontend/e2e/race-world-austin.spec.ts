// L2-064. The live guitarist at the festival plays and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { austinCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('the stage guitarist strums through the festival and holds on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [austinCourseMap]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [austinCourseMap.id] });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(640);
  const row = maps.row(austinCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  let lowest = Infinity;
  let highest = -Infinity;
  await expect
    .poll(
      async () => {
        const metres = await worldRide.guitarHand();
        if (metres !== null) {
          lowest = Math.min(lowest, metres);
          highest = Math.max(highest, metres);
        }
        return highest - lowest;
      },
      { intervals: [32] },
    )
    .toBeGreaterThan(0.09);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const held = await worldRide.guitarHand();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.guitarHand()).toBe(held);
  await race.resume.click();
  await expect.poll(() => worldRide.guitarHand()).not.toBe(held);
});

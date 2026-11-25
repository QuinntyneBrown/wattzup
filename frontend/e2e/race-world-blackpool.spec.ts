// L2-064. A heritage tram approaches a seaward stop and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { blackpoolCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

test('the tram moves along the Promenade and holds on pause', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [blackpoolCourseMap]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [blackpoolCourseMap.id] });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(90);
  const row = maps.row(blackpoolCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  const glow = await worldRide.illumination();
  expect(glow).toBeGreaterThan(0);
  await expect.poll(() => worldRide.illumination()).not.toBe(glow);
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const metres = await worldRide.tramMetres();
      if (metres !== null) samples.push(metres);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.09);
  await race.pause.click();
  await expect(race.resume).toBeVisible();
  const glowHeld = await worldRide.illumination();
  const held = await worldRide.tramMetres();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );
  expect(await worldRide.tramMetres()).toBe(held);
  expect(await worldRide.illumination()).toBe(glowHeld);
  await race.resume.click();
  await expect.poll(() => worldRide.tramMetres()).not.toBe(held);
});

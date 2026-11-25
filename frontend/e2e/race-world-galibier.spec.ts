// L2-065. The Tour flags, spectators and high clouds follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { galibierCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['Tour flag beside the pass road', 11520, 'flagAngle'],
  ['cheering spectator', 18420, 'spectatorHeight'],
  ['cloud over La Meije', 22360, 'cloudPosition'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [galibierCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [galibierCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(galibierCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();

    await expect.poll(() => worldRide.galibierMotion(part)).not.toBeNull();
    const first = await worldRide.galibierMotion(part);
    await expect.poll(() => worldRide.galibierMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.galibierMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.galibierMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.galibierMotion(part)).not.toBe(held);
  });
}

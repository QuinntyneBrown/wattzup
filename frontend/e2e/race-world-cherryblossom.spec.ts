// L2-064. The paddle boats and kites follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { cherryBlossomCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['kite over the Mall', 2160, 'kiteAngle'],
  ['paddle boat below the seawall', 1430, 'boatX'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [cherryBlossomCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [cherryBlossomCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(cherryBlossomCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    if (part === 'kiteAngle') await setup.light('Sunrise').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();

    await expect
      .poll(() => worldRide.basinMotion('haze'))
      .toBe(part === 'kiteAngle' ? 0xf4d5cf : 0xdcebe7);
    const first = await worldRide.basinMotion(part);
    await expect.poll(() => worldRide.basinMotion(part)).not.toBeNull();
    await expect.poll(() => worldRide.basinMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.basinMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.basinMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.basinMotion(part)).not.toBe(held);
  });
}

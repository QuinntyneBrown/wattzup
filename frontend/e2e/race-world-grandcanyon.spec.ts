// L2-065. The park shuttle and the cloud shadows follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { grandcanyonCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['shuttle entering Navajo Point', 10160, 'shuttleMetres'],
  ['cloud shadow over Moran Point', 4480, 'cloudShadow'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [grandcanyonCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [grandcanyonCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(grandcanyonCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();
    await expect.poll(() => worldRide.grandcanyonMotion(part)).not.toBeNull();
    const first = await worldRide.grandcanyonMotion(part);
    await expect.poll(() => worldRide.grandcanyonMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.grandcanyonMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.grandcanyonMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.grandcanyonMotion(part)).not.toBe(held);
  });
}

for (const [feature, metres, point] of [
  ['Colorado River at Lipan Point', 7220, 'riverX'],
  ['Grandview temple', 2050, 'templeX'],
  ['Desert View Watchtower', 13240, 'towerX'],
] as const) {
  test('the rim approach frames the ' + feature, async ({ api, bluetooth, page, worldRide }) => {
    api.answer('GET', '/api/maps', [grandcanyonCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [grandcanyonCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(grandcanyonCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();
    await expect
      .poll(async () => Math.abs((await worldRide.grandcanyonMotion(point)) ?? Infinity))
      .toBeLessThan(0.43);
  });
}

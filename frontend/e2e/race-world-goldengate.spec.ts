// L2-065. The grazing herd and the model yachts follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { goldengateCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['bison grazing in the paddock', 4020, 'bisonHead'],
  ['model yacht sailing on Spreckels Lake', 3040, 'sailPosition'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [goldengateCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [goldengateCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(goldengateCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();
    await expect.poll(() => worldRide.goldengateMotion(part)).not.toBeNull();
    const first = await worldRide.goldengateMotion(part);
    await expect.poll(() => worldRide.goldengateMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.goldengateMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.goldengateMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.goldengateMotion(part)).not.toBe(held);
  });
}

for (const [feature, metres, point] of [
  ['Conservatory of Flowers', 80, 'glassX'],
  ['Dutch Windmill', 5550, 'millX'],
  ['Ocean Beach breakers', 6220, 'surfX'],
] as const) {
  test('the approach frames the ' + feature, async ({ api, bluetooth, page, worldRide }) => {
    api.answer('GET', '/api/maps', [goldengateCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [goldengateCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(goldengateCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();
    await expect
      .poll(async () => Math.abs((await worldRide.goldengateMotion(point)) ?? Infinity))
      .toBeLessThan(0.47);
  });
}

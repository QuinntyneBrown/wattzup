// L2-2134. The Banpo fountain and promenade cyclists follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { hanRiverCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['Banpo fountain', 4620, 'fountainFlow'],
  ['evening park cyclist', 1480, 'cyclePhase'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [hanRiverCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [hanRiverCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(hanRiverCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();
    await expect.poll(() => worldRide.riverMotion(part)).not.toBeNull();
    const first = await worldRide.riverMotion(part);
    await expect.poll(() => worldRide.riverMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.riverMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.riverMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.riverMotion(part)).not.toBe(held);
  });
}

for (const [feature, metres, point] of [
  ['Banpo fountain', 4620, 'banpoX'],
  ['N Seoul Tower', 6390, 'towerX'],
] as const) {
  test('the riverside path frames the ' + feature, async ({ api, bluetooth, page, worldRide }) => {
    api.answer('GET', '/api/maps', [hanRiverCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [hanRiverCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(hanRiverCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();
    await expect
      .poll(async () => Math.abs((await worldRide.riverMotion(point)) ?? Infinity))
      .toBeLessThan(0.43);
    if (feature === 'N Seoul Tower') {
      // The mast should clear the fixed race header on the tablet.
      await expect
        .poll(async () => (await worldRide.riverMotion('towerTopY')) ?? Infinity)
        .toBeLessThan(0.71);
    }
  });
}

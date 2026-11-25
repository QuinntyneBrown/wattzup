// L2-2135. The Herdwick sheep and low cloud on the fells follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { hardknottCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['Herdwick ewe on the verge', 5280, 'grazing'],
  ['Herdwick crossing the lane', 5280, 'crossing'],
  ['mist on the upper fell', 7420, 'fellMist'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [hardknottCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [hardknottCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(hardknottCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();
    await expect.poll(() => worldRide.fellDetail(part)).not.toBeNull();
    const first = await worldRide.fellDetail(part);
    await expect.poll(() => worldRide.fellDetail(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.fellDetail(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.fellDetail(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.fellDetail(part)).not.toBe(held);
  });
}

for (const [feature, metres, point] of [
  ['Roman fort gateway', 3260, 'fortX'],
  ['30% warning sign', 80, 'signX'],
] as const) {
  test('the lane frames the ' + feature, async ({ api, bluetooth, page, worldRide }) => {
    api.answer('GET', '/api/maps', [hardknottCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [hardknottCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(hardknottCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();
    await expect
      .poll(async () => Math.abs((await worldRide.fellDetail(point)) ?? Infinity))
      .toBeLessThan(0.43);
  });
}

// L2-065. Southern Ocean surf and passing cloud light follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { greatoceanCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['surf breaking beneath the Apostles', 5050, 'waveCrest'],
  ['late coastal light at London Bridge', 8240, 'coastalLight'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [greatoceanCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [greatoceanCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(greatoceanCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();
    await expect.poll(() => worldRide.greatoceanMotion(part)).not.toBeNull();
    const first = await worldRide.greatoceanMotion(part);
    await expect.poll(() => worldRide.greatoceanMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.greatoceanMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.greatoceanMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.greatoceanMotion(part)).not.toBe(held);
  });
}

for (const [feature, metres, point] of [
  ['Memorial Arch', 80, 'archX'],
  ['Twelve Apostles stacks', 5050, 'apostleX'],
  ['London Bridge span', 8240, 'bridgeX'],
] as const) {
  test(
    'the coastal approach frames the ' + feature,
    async ({ api, bluetooth, page, worldRide }) => {
      api.answer('GET', '/api/maps', [greatoceanCourseMap]);
      api.answer('GET', '/api/progress', {
        ...newRiderProgress,
        openMapIds: [greatoceanCourseMap.id],
      });
      await worldRide.pin('low', 'webgl2');
      await bluetooth.remember(echelonBike);
      const race = new RacePage(page);
      const maps = new MapSelectPage(page);
      await maps.open();
      await worldRide.startAt(metres);
      const row = maps.row(greatoceanCourseMap.name);
      await row.root.click();
      const setup = new RaceSetupPage(page);
      await setup.mode('Your best time').click();
      await setup.start.click();
      await expect(race.backend).toBeVisible();
      await expect
        .poll(async () => Math.abs((await worldRide.greatoceanMotion(point)) ?? Infinity))
        .toBeLessThan(0.43);
    },
  );
}

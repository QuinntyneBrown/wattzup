// L2-065. The camels and horse cart at Panorama Point follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { gizaCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['saddled dromedary', 6820, 'camelHead'],
  ['horse cart', 6800, 'cartPosition'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [gizaCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [gizaCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(gizaCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();

    await expect.poll(() => worldRide.gizaMotion(part)).not.toBeNull();
    const first = await worldRide.gizaMotion(part);
    await expect.poll(() => worldRide.gizaMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.gizaMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.gizaMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.gizaMotion(part)).not.toBe(held);
  });
}

for (const [landmark, metres, part] of [
  ['Khafre', 80, 'khafreScreenX'],
  ['Khufu', 1430, 'khufuScreenX'],
  ['Sphinx', 4560, 'sphinxScreenX'],
] as const) {
  test(`the ${landmark} approach frames the monument between the HUD panels`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [gizaCourseMap]);
    api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [gizaCourseMap.id] });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    await maps.row(gizaCourseMap.name).root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    const race = new RacePage(page);
    await expect(race.backend).toBeVisible();
    await expect
      .poll(async () => Math.abs((await worldRide.gizaMotion(part)) ?? Infinity))
      .toBeLessThan(0.56);
  });
}

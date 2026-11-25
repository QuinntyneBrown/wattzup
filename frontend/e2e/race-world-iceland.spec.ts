// L2-2139. Each moving landmark follows the ride clock while it is in view.
import { newRiderProgress } from './fixtures/api';
import { icelandCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['falling water at Skógafoss', 2420, 'fallsPhase'],
  ['grazing horse beside the glacial river', 10280, 'grazingAngle'],
  ['iceberg at Jökulsárlón', 10960, 'iceShift'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [icelandCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [icelandCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(icelandCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();
    await expect.poll(() => worldRide.southCoastDetail(part)).not.toBeNull();
    const first = await worldRide.southCoastDetail(part);
    await expect.poll(() => worldRide.southCoastDetail(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.southCoastDetail(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.southCoastDetail(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.southCoastDetail(part)).not.toBe(held);
  });
}

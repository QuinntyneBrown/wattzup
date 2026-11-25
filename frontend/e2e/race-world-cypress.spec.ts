// L2-065. The Cypress Mountain training riders and ski chairs follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { cypressCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['climbing cyclist', 5510, 'climberX'],
  ['Lions Express chair', 17925, 'chairX'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [cypressCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [cypressCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(cypressCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();

    const first = await worldRide.mountainMotion(part);
    await expect.poll(() => worldRide.mountainMotion(part)).not.toBeNull();
    await expect.poll(() => worldRide.mountainMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.mountainMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.mountainMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.mountainMotion(part)).not.toBe(held);
  });
}

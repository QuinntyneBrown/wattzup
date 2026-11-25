// L2-064. The Ligurian fishing boats and walkers follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { cinqueTerreCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['hiker at the Sentiero Azzurro crossing', 320, 'hikerX'],
  ['gozzo moored below Vernazza', 4040, 'boatRoll'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [cinqueTerreCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [cinqueTerreCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(cinqueTerreCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();

    const first = await worldRide.ligurianMotion(part);
    await expect.poll(() => worldRide.ligurianMotion(part)).not.toBeNull();
    await expect.poll(() => worldRide.ligurianMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.ligurianMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.ligurianMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.ligurianMotion(part)).not.toBe(held);
  });
}

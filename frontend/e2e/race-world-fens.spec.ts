// L2-065. The turbine, dust and cloud shadow follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { fensCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['drainage district turbine', 7890, 'turbineAngle'],
  ['cloud bank', 80, 'cloudBearing'],
  ['crosswind dust', 5450, 'dustPosition'],
  ['cloud shadow', 10720, 'shadowOffset'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [fensCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [fensCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(fensCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();

    await expect.poll(() => worldRide.fenlandMotion(part)).not.toBeNull();
    const first = await worldRide.fenlandMotion(part);
    await expect.poll(() => worldRide.fenlandMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.fenlandMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.fenlandMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.fenlandMotion(part)).not.toBe(held);
  });
}

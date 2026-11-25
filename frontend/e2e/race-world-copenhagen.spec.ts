// L2-065. The Copenhagen cargo cyclists and green-wave markers follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { copenhagenCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['cargo cyclist pedal', 680, 'cargoPedalY'],
  ['green wave of junction LEDs', 120, 'markerCount'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [copenhagenCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [copenhagenCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(copenhagenCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();

    const first = await worldRide.commuterMotion(part);
    await expect.poll(() => worldRide.commuterMotion(part)).not.toBeNull();
    await expect.poll(() => worldRide.commuterMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.commuterMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.commuterMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.commuterMotion(part)).not.toBe(held);
  });
}

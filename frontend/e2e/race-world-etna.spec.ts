// L2-065. The summit plume, crater walker and gondola follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { etnaCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['tarmac heat shimmer', 4760, 'heatPhase'],
  ['refuge tour bus', 10740, 'busPosition'],
  ['summit plume', 80, 'plumeHeight'],
  ['Silvestri crater walker', 8380, 'walkerPosition'],
  ['Sapienza gondola', 12180, 'gondolaPosition'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [etnaCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [etnaCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(etnaCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();

    await expect.poll(() => worldRide.etnaMotion(part)).not.toBeNull();
    const first = await worldRide.etnaMotion(part);
    await expect.poll(() => worldRide.etnaMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.etnaMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.etnaMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.etnaMotion(part)).not.toBe(held);
  });
}

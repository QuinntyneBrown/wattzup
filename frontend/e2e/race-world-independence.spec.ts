// L2-2140. Each moving landmark follows the ride clock while it is in view.
import { newRiderProgress } from './fixtures/api';
import { independenceCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['aspen canopy on the lower approach', 80, 'leafSway'],
  ['Roaring Fork cascade', 2180, 'riverPhase'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [independenceCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [independenceCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(independenceCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();
    await expect.poll(() => worldRide.passDetail(part)).not.toBeNull();
    const first = await worldRide.passDetail(part);
    await expect.poll(() => worldRide.passDetail(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.passDetail(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.passDetail(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.passDetail(part)).not.toBe(held);
  });
}

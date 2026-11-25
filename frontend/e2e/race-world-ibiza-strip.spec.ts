// L2-2138. The dancer, yacht, festoons and booth beams follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { ibizaCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['dancer at the DJ terrace', 3060, 'armTilt'],
  ['anchored sailboat at Caló des Moro', 960, 'hullRoll'],
  ['festoon over the promenade', 7420, 'cableSway'],
  ['beam above the DJ booth', 3060, 'beamYaw'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [ibizaCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [ibizaCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(ibizaCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();
    await expect.poll(() => worldRide.stripDetail(part)).not.toBeNull();
    const first = await worldRide.stripDetail(part);
    await expect.poll(() => worldRide.stripDetail(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.stripDetail(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.stripDetail(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.stripDetail(part)).not.toBe(held);
  });
}

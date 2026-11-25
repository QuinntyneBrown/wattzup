// L2-065. The cows, postbus and valley clouds follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { furkaCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['cow beside the lower road', 2460, 'cowHead'],
  ['yellow postbus', 12280, 'postbusPosition'],
  ['rising valley cloud', 14460, 'cloudHeight'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [furkaCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [furkaCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(furkaCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();

    await expect.poll(() => worldRide.furkaMotion(part)).not.toBeNull();
    if (part === 'cloudHeight') {
      await expect
        .poll(async () => (await worldRide.furkaMotion('iceAboveLake')) ?? 0)
        .toBeGreaterThan(18);
    }
    if (part === 'postbusPosition') {
      await expect
        .poll(async () => (await worldRide.furkaMotion('postbusDistance')) ?? Infinity)
        .toBeLessThan(85);
    }
    const first = await worldRide.furkaMotion(part);
    await expect.poll(() => worldRide.furkaMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.furkaMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.furkaMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.furkaMotion(part)).not.toBe(held);
  });
}

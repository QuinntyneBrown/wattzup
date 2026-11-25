// L2-064. The Headland Road breakers and lookout walkers follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { maps } from './fixtures/maps';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

const cliffsideCoast = maps.find((map) => map.id === 'cliffside-coast')!;

for (const [actor, metres, part] of [
  ['walker at the lookout', 650, 'walkerX'],
  ['breaker in the cove', 2400, 'breakerHeight'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [cliffsideCoast]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [cliffsideCoast.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(cliffsideCoast.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();

    const first = await worldRide.headlandMotion(part);
    await expect.poll(() => worldRide.headlandMotion(part)).not.toBeNull();
    await expect.poll(() => worldRide.headlandMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.headlandMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.headlandMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.headlandMotion(part)).not.toBe(held);
  });
}

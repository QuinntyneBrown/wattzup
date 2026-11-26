// L2-2223. Each moving landmark follows the ride clock while it is in view.
import { newRiderProgress } from './fixtures/api';
import { surfersCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import type { Page } from '@playwright/test';
import type { ApiFixture } from './fixtures/api';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import type { WorldRideProbe } from './fixtures/world-ride-probe';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

async function enterEsplanade(
  metres: number,
  page: Page,
  api: ApiFixture,
  bluetooth: FakeBluetooth,
  worldRide: WorldRideProbe,
) {
  api.answer('GET', '/api/maps', [surfersCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [surfersCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(metres);
  const row = maps.row(surfersCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  return race;
}

for (const [actor, metres, part] of [
  ['Gold Coast breaker', 4420, 'breakerTravel'],
  ['Gold Coast patrol flag', 9050, 'patrolFold'],
  ['Gold Coast tram', 12880, 'tramTravel'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    const race = await enterEsplanade(metres, page, api, bluetooth, worldRide);
    await expect.poll(() => worldRide.coursePose(part)).not.toBeNull();
    const first = await worldRide.coursePose(part);
    await expect.poll(() => worldRide.coursePose(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.coursePose(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.coursePose(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.coursePose(part)).not.toBe(held);
  });
}

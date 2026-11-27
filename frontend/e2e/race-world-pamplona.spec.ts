// L2-2186. Each moving landmark follows the ride clock while it is in view.
import { newRiderProgress } from './fixtures/api';
import { pamplonaCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import type { Page } from '@playwright/test';
import type { ApiFixture } from './fixtures/api';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import type { WorldRideProbe } from './fixtures/world-ride-probe';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

async function enterPamplona(
  metres: number,
  page: Page,
  api: ApiFixture,
  bluetooth: FakeBluetooth,
  worldRide: WorldRideProbe,
) {
  api.answer('GET', '/api/maps', [pamplonaCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [pamplonaCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(metres);
  const row = maps.row(pamplonaCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  return race;
}

for (const [actor, metres, part] of [
  ['Santo Domingo runner', 80, 'runnerStride'],
  ['Estafeta balcony scarf', 5020, 'scarfFold'],
  ['Telefónica confetti', 7170, 'confettiDrop'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    const race = await enterPamplona(metres, page, api, bluetooth, worldRide);
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

test('Calle Mercaderes turns right into Calle Estafeta', async ({
  page,
  api,
  bluetooth,
  worldRide,
}) => {
  const course = page.waitForResponse(
    (response) => response.url().endsWith('/courses/pamplona.course.json') && response.ok(),
  );
  await enterPamplona(3160, page, api, bluetooth, worldRide);
  const road = (await (await course).json()) as {
    startIndex: number;
    step: number;
    points: number[];
  };
  const bearing = (metres: number) => {
    const i = 3 * (road.startIndex + Math.round(metres / road.step));
    return Math.atan2(
      road.points[i + 5]! - road.points[i + 2]!,
      road.points[i + 3]! - road.points[i]!,
    );
  };
  const angle = bearing(3196) - bearing(3164);
  const degrees = (Math.atan2(Math.sin(angle), Math.cos(angle)) * 180) / Math.PI;
  expect(degrees).toBeGreaterThan(84);
  expect(degrees).toBeLessThan(96);
});

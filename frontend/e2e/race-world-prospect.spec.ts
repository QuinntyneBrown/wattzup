// L2-2189. Each moving landmark follows the ride clock while it is in view.
import { newRiderProgress } from './fixtures/api';
import { prospectCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import type { Page } from '@playwright/test';
import type { ApiFixture } from './fixtures/api';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import type { WorldRideProbe } from './fixtures/world-ride-probe';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

async function enterPark(
  metres: number,
  page: Page,
  api: ApiFixture,
  bluetooth: FakeBluetooth,
  worldRide: WorldRideProbe,
) {
  api.answer('GET', '/api/maps', [prospectCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [prospectCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(metres);
  const row = maps.row(prospectCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  return race;
}

for (const [actor, metres, part] of [
  ['Long Meadow runner on lap two', 7440, 'runnerTravel'],
  ['meadow dog', 1240, 'dogTravel'],
  ['Lullwater swan', 5720, 'swanTravel'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    const race = await enterPark(metres, page, api, bluetooth, worldRide);
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

test('two circuits return to East Drive without resetting workout distance', async ({
  page,
  api,
  bluetooth,
  worldRide,
}) => {
  const geometry = page.waitForResponse(
    (r) => r.url().endsWith('/courses/prospect.course.json') && r.ok(),
  );
  await enterPark(6200, page, api, bluetooth, worldRide);
  const road = (await (await geometry).json()) as {
    lengthMetres: number;
    startIndex: number;
    step: number;
    points: number[];
  };
  const position = (metres: number, axis: number) => {
    const station = metres / road.step + road.startIndex;
    const start = Math.floor(station) * 3 + axis;
    return road.points[start]! + (road.points[start + 3]! - road.points[start]!) * (station % 1);
  };
  expect(road.lengthMetres).toBeCloseTo(12400, 0);
  for (const station of [0, 1240, 2860, 4060, 5130, 5720]) {
    const offset = [0, 1, 2].map(
      (axis) => position(station + 6200, axis) - position(station, axis),
    );
    expect(Math.hypot(...offset)).toBeLessThan(0.15);
  }
});

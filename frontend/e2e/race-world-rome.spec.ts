// L2-2198. Each moving landmark follows the ride clock while it is in view.
import { newRiderProgress } from './fixtures/api';
import { romeCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import type { Page } from '@playwright/test';
import type { ApiFixture } from './fixtures/api';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import type { WorldRideProbe } from './fixtures/world-ride-probe';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

async function enterRome(
  metres: number,
  page: Page,
  api: ApiFixture,
  bluetooth: FakeBluetooth,
  worldRide: WorldRideProbe,
) {
  api.answer('GET', '/api/maps', [romeCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [romeCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(metres);
  const row = maps.row(romeCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  return race;
}

for (const [actor, metres, part] of [
  ['Forum guide on lap three', 11150, 'guideUmbrella'],
  ['Palatine Vespa', 2210, 'vespaTravel'],
  ['San Gregorio taxi', 2210, 'taxiTravel'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    const race = await enterRome(metres, page, api, bluetooth, worldRide);
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

test('three circuits return to Piazza Venezia without resetting workout distance', async ({
  page,
  api,
  bluetooth,
  worldRide,
}) => {
  const geometry = page.waitForResponse(
    (r) => r.url().endsWith('/courses/rome.course.json') && r.ok(),
  );
  await enterRome(14980.8333333333 / 3, page, api, bluetooth, worldRide);
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
  expect(road.lengthMetres).toBeCloseTo(14980.8333333333, 0);
  for (const station of [80, 520, 910, 1370, 2210, 3800]) {
    for (const lap of [1, 2]) {
      const offset = [0, 1, 2].map(
        (axis) => position(station + lap * (14980.8333333333 / 3), axis) - position(station, axis),
      );
      expect(Math.hypot(...offset)).toBeLessThan(0.15);
    }
  }
});

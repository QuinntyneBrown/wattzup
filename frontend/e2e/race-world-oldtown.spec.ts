// L2-2180. Each moving landmark follows the ride clock while it is in view.
import { newRiderProgress } from './fixtures/api';
import { maps } from './fixtures/maps';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import type { Page } from '@playwright/test';
import type { ApiFixture } from './fixtures/api';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import type { WorldRideProbe } from './fixtures/world-ride-probe';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

const oldTownCourseMap = maps.find((map) => map.id === 'old-town-criterium')!;

async function enterOldTown(
  metres: number,
  page: Page,
  api: ApiFixture,
  bluetooth: FakeBluetooth,
  worldRide: WorldRideProbe,
) {
  api.answer('GET', '/api/maps', [oldTownCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [oldTownCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(metres);
  const row = maps.row(oldTownCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  return race;
}

test('the rider sees worn setts and the cathedral west front on the seventh kick', async ({
  page,
  api,
  bluetooth,
  worldRide,
}) => {
  await enterOldTown(10450, page, api, bluetooth, worldRide);
  await expect.poll(() => worldRide.drawnCourseSections('MarktSetts')).toBeGreaterThan(0);
  await expect.poll(() => worldRide.drawnCourseSections('WestPortal')).toBeGreaterThan(0);
});
for (const [actor, metres, part] of [
  ['supporter flag', 2530, 'fanWave'],
  ['street pennants', 4310, 'pennantRise'],
  ['finish bell', 14050, 'bellSwing'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    const race = await enterOldTown(metres, page, api, bluetooth, worldRide);
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

test('Cathedral Circuit turns a right angle between the townhouse kerbs', async ({
  page,
  api,
  bluetooth,
  worldRide,
}) => {
  const course = page.waitForResponse(
    (response) => response.url().endsWith('/courses/oldtown.course.json') && response.ok(),
  );
  await enterOldTown(4310, page, api, bluetooth, worldRide);
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
  const angle = bearing(4356) - bearing(4324);
  const degrees = (Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) * 180) / Math.PI;
  expect(degrees).toBeGreaterThan(84);
  expect(degrees).toBeLessThan(96);
});

// L2-2192. Each moving landmark follows the ride clock while it is in view.
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

const prairieCourseMap = maps.find((map) => map.id === 'prairie-paceline')!;

async function enterPrairie(
  metres: number,
  page: Page,
  api: ApiFixture,
  bluetooth: FakeBluetooth,
  worldRide: WorldRideProbe,
) {
  api.answer('GET', '/api/maps', [prairieCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [prairieCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(metres);
  const row = maps.row(prairieCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  return race;
}

for (const [actor, metres, part] of [
  ['ridge turbine', 2480, 'rotorAngle'],
  ['roadside wheat', 5210, 'wheatLean'],
  ['prairie cloud', 17960, 'cloudDrift'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    const race = await enterPrairie(metres, page, api, bluetooth, worldRide);
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
test('Route 9 holds a straight bearing over the full rolling course', async ({
  page,
  api,
  bluetooth,
  worldRide,
}) => {
  const data = page.waitForResponse(
    (r) => r.ok() && r.url().endsWith('/courses/prairie.course.json'),
  );
  await enterPrairie(80, page, api, bluetooth, worldRide);
  const course = (await (await data).json()) as {
    lengthMetres: number;
    climbingMetres: number;
    durationSeconds: number;
    startIndex: number;
    step: number;
    points: number[];
  };
  expect(course.lengthMetres).toBe(18400);
  expect(course.climbingMetres).toBe(90);
  expect(course.durationSeconds).toBe(1800);
  const coordinate = (d: number, axis: number) =>
    course.points[(course.startIndex + Math.round(d / course.step)) * 3 + axis]!;
  const x0 = coordinate(0, 0),
    z0 = coordinate(0, 2),
    ex = coordinate(18400, 0) - x0,
    ez = coordinate(18400, 2) - z0;
  const straight = Math.hypot(ex, ez);
  expect(straight).toBeGreaterThan(18380);
  for (let d = 0; d < 18400; d += 200) {
    const sideways =
      Math.abs((coordinate(d, 0) - x0) * ez - (coordinate(d, 2) - z0) * ex) / straight;
    expect(sideways).toBeLessThan(2);
  }
});

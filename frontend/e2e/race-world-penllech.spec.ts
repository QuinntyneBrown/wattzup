// L2-2187. Each moving landmark follows the ride clock while it is in view.
import { newRiderProgress } from './fixtures/api';
import { penllechCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import type { Page } from '@playwright/test';
import type { ApiFixture } from './fixtures/api';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import type { WorldRideProbe } from './fixtures/world-ride-probe';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

async function enterPenLlech(
  metres: number,
  page: Page,
  api: ApiFixture,
  bluetooth: FakeBluetooth,
  worldRide: WorldRideProbe,
) {
  api.answer('GET', '/api/maps', [penllechCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [penllechCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(metres);
  const row = maps.row(penllechCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  return race;
}

for (const [actor, metres, part] of [
  ['Harlech drizzle', 80, 'rainFall'],
  ['wall-top spectator', 11120, 'spectatorWave'],
  ['castle flag', 13680, 'flagFold'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    const race = await enterPenLlech(metres, page, api, bluetooth, worldRide);
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

test('the steep lane reaches 37.45% and turns left at the upper hairpin', async ({
  page,
  api,
  bluetooth,
  worldRide,
}) => {
  const geometry = page.waitForResponse(
    (r) => r.url().endsWith('/courses/penllech.course.json') && r.ok(),
  );
  await enterPenLlech(11120, page, api, bluetooth, worldRide);
  const road = (await (await geometry).json()) as {
    startIndex: number;
    step: number;
    points: number[];
  };
  const delta = (d: number) => {
    const i = 3 * (road.startIndex + Math.round(d / road.step));
    return [
      road.points[i + 3]! - road.points[i]!,
      road.points[i + 4]! - road.points[i + 1]!,
      road.points[i + 5]! - road.points[i + 2]!,
    ] as const;
  };
  const [x, y, z] = delta(11120);
  expect((100 * y) / Math.hypot(x, z)).toBeCloseTo(37.45, 1);
  const before = delta(11192),
    after = delta(11228);
  const raw = Math.atan2(after[2], after[0]) - Math.atan2(before[2], before[0]);
  expect((Math.atan2(Math.sin(raw), Math.cos(raw)) * 180) / Math.PI).toBeLessThan(-130);
});

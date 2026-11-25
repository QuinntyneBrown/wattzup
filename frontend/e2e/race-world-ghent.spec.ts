// L2-065. The Madison riders and infield spectators follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { ghentCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { WorldMusic } from './fixtures/world-music';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['resting Madison rider', 537, 'relayPosition'],
  ['infield spectator', 87, 'spectatorHeight'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [ghentCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [ghentCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(ghentCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();

    await expect.poll(() => worldRide.ghentMotion(part)).not.toBeNull();
    const first = await worldRide.ghentMotion(part);
    await expect.poll(() => worldRide.ghentMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.ghentMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.ghentMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.ghentMotion(part)).not.toBe(held);
  });
}

test('the roof stays level across the steep banking and the lap board follows distance', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [ghentCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [ghentCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(368);
  const row = maps.row(ghentCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();

  await expect
    .poll(async () => Math.abs((await worldRide.ghentMotion('cameraRoll')) ?? 0))
    .toBeGreaterThan(0.09);
  await expect.poll(() => worldRide.ghentMotion('displayLap')).toBe(3);
});

test('the Ghent brass band plays when the race begins', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  const music = await WorldMusic.install(page);
  api.answer('GET', '/api/maps', [ghentCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [ghentCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(0);
  const row = maps.row(ghentCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();

  await expect.poll(() => music.played()).toContain('music/ghent-six-day.ogg');
});

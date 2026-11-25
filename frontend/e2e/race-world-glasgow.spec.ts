// L2-065. The umbrella crowd and the spray behind the bikes follow the ride clock.
import { newRiderProgress } from './fixtures/api';
import { glasgowCourseMap } from './fixtures/course';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const [actor, metres, part] of [
  ['umbrella above the championship crowd', 9240, 'umbrellaHeight'],
  ['spray behind the rear wheel', 3540, 'sprayHeight'],
] as const) {
  test(`the ${actor} moves and holds still on pause`, async ({
    api,
    bluetooth,
    page,
    worldRide,
  }) => {
    api.answer('GET', '/api/maps', [glasgowCourseMap]);
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [glasgowCourseMap.id],
    });
    await worldRide.pin('low', 'webgl2');
    await bluetooth.remember(echelonBike);
    const race = new RacePage(page);
    const maps = new MapSelectPage(page);
    await maps.open();
    await worldRide.startAt(metres);
    const row = maps.row(glasgowCourseMap.name);
    await row.root.click();
    const setup = new RaceSetupPage(page);
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(race.backend).toBeVisible();
    if (part === 'sprayHeight') {
      await expect.poll(() => worldRide.drawnCourseSections('Tenements')).toBeGreaterThan(0);
      await expect.poll(() => worldRide.drawnCourseSections('RaceBoards')).toBeGreaterThan(0);
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
    }

    await expect.poll(() => worldRide.glasgowMotion(part)).not.toBeNull();
    const first = await worldRide.glasgowMotion(part);
    await expect.poll(() => worldRide.glasgowMotion(part)).not.toBe(first);
    await race.pause.click();
    await expect(race.resume).toBeVisible();
    const held = await worldRide.glasgowMotion(part);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
    );
    expect(await worldRide.glasgowMotion(part)).toBe(held);
    await race.resume.click();
    await expect.poll(() => worldRide.glasgowMotion(part)).not.toBe(held);
  });
}

test('the finish gantry frames City Chambers on the home straight', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [glasgowCourseMap]);
  api.answer('GET', '/api/progress', {
    ...newRiderProgress,
    openMapIds: [glasgowCourseMap.id],
  });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  const maps = new MapSelectPage(page);
  await maps.open();
  await worldRide.startAt(12980);
  const row = maps.row(glasgowCourseMap.name);
  await row.root.click();
  const setup = new RaceSetupPage(page);
  await setup.mode('Your best time').click();
  await setup.start.click();
  await expect(race.backend).toBeVisible();
  await expect
    .poll(async () => Math.abs((await worldRide.glasgowMotion('gantryX')) ?? Infinity))
    .toBeLessThan(0.45);
  await expect
    .poll(async () => Math.abs((await worldRide.glasgowMotion('chambersX')) ?? Infinity))
    .toBeLessThan(0.48);
});

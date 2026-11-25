// L2-064. The supporters’ orange smoke drifts at bend seven with the race clock.
import { newRiderProgress } from './fixtures/api';
import { alpeCourseMap } from './fixtures/course';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { startRace, stepUntil } from './fixtures/race';
import { expect, test } from './fixtures/test';
import { RacePage } from './pages/race.page';

test('orange smoke drifts above the supporters at Dutch Corner', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [alpeCourseMap]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [alpeCourseMap.id] });
  await worldRide.pin('low', 'webgl2');
  await page.addInitScript(() => {
    (window as unknown as { __wzWorldRide: { from: number } }).__wzWorldRide.from = 4890;
  });
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open(alpeCourseMap.id, 'mode=solo');
  await expect(race.backend).toBeVisible();
  const samples: number[] = [];
  await expect
    .poll(async () => {
      const height = await worldRide.smokeHeight();
      if (height !== null) samples.push(height);
      return Math.max(...samples) - Math.min(...samples);
    })
    .toBeGreaterThan(0.05);
});

test('a late frame puts the Alpe rider at the distance on their HUD', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  await worldRide.pin('low', 'webgl2');
  const race = await startRace(page, bluetooth, api, alpeCourseMap.id, 'mode=solo', {
    catalogue: [alpeCourseMap],
    world: true,
  });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  for (let second = 0; second < 24; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
    await page.clock.fastForward(1000);
  }
  await page.clock.runFor(80);
  const metres = parseFloat((await race.distance.textContent())!) * 1000;
  expect(metres).toBeGreaterThan(200);
  // The HUD rounds to 10 m, and the scene interpolates less than a second of travel.
  expect(Math.abs((await worldRide.courseMetres())! - metres)).toBeLessThan(20);
});

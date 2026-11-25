import { newRiderProgress } from '../fixtures/api';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { aguascalientesCourseMap } from '../fixtures/course';
import { expect, test } from '../fixtures/test';
import { RacePage } from '../pages/race.page';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

test('Aguascalientes rider views with the race HUD', async ({
  page,
  bluetooth,
  api,
  worldRide,
}) => {
  const id = 'aguascalientes';
  api.answer('GET', '/api/maps', [aguascalientesCourseMap]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [id] });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open(id, 'mode=solo');
  await expect(race.backend).toBeVisible({ timeout: 90000 });
  const version = process.env['AGUASCALIENTES_CAPTURE'] ?? 'after';
  for (const [name, metres] of [
    ['opening', 0],
    ['bank', 65],
    ['pursuit', 125],
  ] as const) {
    await expect(async () => {
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
      expect(parseFloat((await race.distance.textContent()) ?? '') * 1000).toBeGreaterThanOrEqual(
        metres,
      );
    }).toPass({ intervals: [200], timeout: 120000 });
    await page.screenshot({
      path: '../docs/screenshots/aguascalientes/' + version + '-' + name + '.jpg',
      quality: 88,
    });
    if (version === 'after' && (name === 'opening' || name === 'pursuit')) {
      const file = name === 'opening' ? 'aguascalientes-photo.jpg' : 'aguascalientes.jpg';
      await race.world.screenshot({
        path: 'projects/ride/public/maps/' + file,
        quality: 90,
        style: '.race > :not(.race-scene) { visibility: hidden !important; }',
      });
    }
  }
});

import { amsterdamCourseMap } from '../fixtures/course';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { newRiderProgress } from '../fixtures/api';
import { RacePage } from '../pages/race.page';
import { expect, test } from '../fixtures/test';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

test('Amsterdam Canals along the Herengracht, across a bridge and past the houseboats', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  await worldRide.pin('low', 'webgl2');
  const map = amsterdamCourseMap;
  api.answer('GET', '/api/maps', [map]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [map.id] });
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open(map.id, 'mode=solo');
  await expect(race.backend).toBeVisible();
  const version = process.env['AMSTERDAM_CAPTURE'] ?? 'after';
  for (const [name, km] of [
    ['quay', 0.04],
    ['bridge', 0.095],
    ['crest', 0.13],
    ['moorings', 0.3],
  ] as const) {
    await expect
      .poll(
        async () => {
          await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
          await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
          return parseFloat((await race.distance.textContent())!);
        },
        { timeout: 45000, intervals: [200] },
      )
      .toBeGreaterThanOrEqual(km);
    await page.screenshot({
      path: '../docs/screenshots/amsterdam-canals/' + version + '-' + name + '.jpg',
      quality: 88,
    });
    if (version === 'after' && (name === 'quay' || name === 'moorings')) {
      const asset = name === 'quay' ? 'amsterdam-canals-photo.jpg' : 'amsterdam-canals.jpg';
      await race.world.screenshot({
        path: 'projects/ride/public/maps/' + asset,
        quality: 90,
        style: '.race > :not(.race-scene) { visibility:hidden !important; }',
      });
    }
  }
});

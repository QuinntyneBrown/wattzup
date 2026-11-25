import { bathshebaCourseMap } from '../fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { startRace, stepUntil } from '../fixtures/race';
import { expect, test } from '../fixtures/test';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

test('Follow the East Coast Road through Bathsheba village to the Soup Bowl', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  await worldRide.pin('low', 'webgl2');
  const race = await startRace(page, bluetooth, api, bathshebaCourseMap.id, 'mode=solo', {
    catalogue: [bathshebaCourseMap],
    world: true,
  });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  const version = process.env['BATHSHEBA_CAPTURE'] ?? 'after';
  for (const [name, km] of [
    ['village', 0.08],
    ['rum-shop', 0.58],
    ['soup-bowl', 1.23],
    ['boats', 2.19],
    ['headland', 5.07],
    ['reef', 8.14],
  ] as const) {
    while (parseFloat((await race.distance.textContent())!) < km) {
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
      // The baseline integrates distance on animation frames and caps each step at
      // 250 ms. Keep it in step with the HUD when advancing the simulated clock.
      for (let frame = 0; frame < 5; frame++) await page.clock.fastForward(200);
    }
    await page.clock.resume();
    // Let the browser present the animated rider on its own clock at each viewpoint.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    await page.screenshot({
      path: '../docs/screenshots/bathsheba-barbados/' + version + '-' + name + '.jpg',
      quality: 88,
    });
    if (version === 'after' && (name === 'village' || name === 'reef')) {
      const asset = name === 'village' ? 'bathsheba-barbados-photo.jpg' : 'bathsheba-barbados.jpg';
      await race.world.screenshot({
        path: 'projects/ride/public/maps/' + asset,
        quality: 90,
        style: '.race > :not(.race-scene) { visibility:hidden !important; }',
      });
    }
    const current = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(current + 1000);
  }
});

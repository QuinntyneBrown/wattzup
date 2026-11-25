import { bigSurCourseMap } from '../fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { startRace, stepUntil } from '../fixtures/race';
import { expect, test } from '../fixtures/test';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

test('Ride Highway 1 above Bixby Canyon and McWay Cove', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  await worldRide.pin('low', 'webgl2');
  const race = await startRace(page, bluetooth, api, bigSurCourseMap.id, 'mode=solo', {
    catalogue: [bigSurCourseMap],
    world: true,
  });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  const version = process.env['BIGSUR_CAPTURE'] ?? 'after';
  for (const [name, km] of [
    ['rocky', 0.16],
    ['bixby', 1.105],
    ['deck', 1.46],
    ['stacks', 3.32],
    ['mcway', 5.74],
    ['fog', 12.18],
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
      path: '../docs/screenshots/big-sur/' + version + '-' + name + '.jpg',
      quality: 88,
    });
    if (version === 'after' && (name === 'rocky' || name === 'fog')) {
      const asset = name === 'rocky' ? 'big-sur-photo.jpg' : 'big-sur.jpg';
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

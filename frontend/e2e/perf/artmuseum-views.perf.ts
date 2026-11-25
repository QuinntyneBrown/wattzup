import { artMuseumCourseMap } from '../fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { startRace, stepUntil } from '../fixtures/race';
import { expect, test } from '../fixtures/test';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

test('Philadelphia from Logan Circle to Eakins Oval, the steps and the return view', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  await worldRide.pin('low', 'webgl2');
  const race = await startRace(page, bluetooth, api, artMuseumCourseMap.id, 'mode=solo', {
    catalogue: [artMuseumCourseMap],
    world: true,
  });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  const version = process.env['ARTMUSEUM_CAPTURE'] ?? 'after';
  for (const [name, km] of [
    ['parkway', 0.08],
    ['swann', 0.21],
    ['oval', 1.65],
    ['steps', 1.84],
    ['return', 2.04],
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
      path: '../docs/screenshots/philadelphia-art-museum/' + version + '-' + name + '.jpg',
      quality: 88,
    });
    if (version === 'after' && (name === 'parkway' || name === 'steps')) {
      const asset =
        name === 'parkway' ? 'philadelphia-art-museum-photo.jpg' : 'philadelphia-art-museum.jpg';
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

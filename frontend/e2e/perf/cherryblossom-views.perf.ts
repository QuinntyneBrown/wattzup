import { mkdir, writeFile } from 'node:fs/promises';
import { cherryBlossomCourseMap } from '../fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { startRace, stepUntil } from '../fixtures/race';
import { expect, test } from '../fixtures/test';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

test('Ride the Tidal Basin beneath the cherry blossoms', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  await worldRide.pin('low', 'webgl2');
  const race = await startRace(page, bluetooth, api, cherryBlossomCourseMap.id, 'mode=solo', {
    catalogue: [cherryBlossomCourseMap],
    world: true,
  });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  test.setTimeout(15 * 60_000);
  const cdp = await page.context().newCDPSession(page);
  await mkdir('../docs/screenshots/cherry-blossom-festival-dc', { recursive: true });
  const version = process.env['CHERRYBLOSSOM_CAPTURE'] ?? 'after';
  for (const [name, km] of [
    ['blossoms', 0.08],
    ['jefferson', 0.56],
    ['seawall', 1.01],
    ['boats', 1.43],
    ['kites', 2.16],
    ['monument', 2.83],
  ] as const) {
    while (parseFloat((await race.distance.textContent())!) < km) {
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
      // The baseline integrates distance on animation frames and caps each step at
      // 250 ms. Keep it in step with the HUD when advancing the simulated clock.
      if (version === 'before') {
        for (let frame = 0; frame < 4; frame++) await page.clock.fastForward(250);
      } else {
        // The authored course reads the same physical race distance as the HUD.
        await page.clock.fastForward(1000);
      }
    }
    // Capture the submitted frame with the ride clock held at this chainage. Resuming
    // for a screenshot lets a loaded browser travel metres beyond the reference position.
    await page.clock.runFor(34);
    const capture = async (path: string): Promise<void> => {
      const frame = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 91 });
      await writeFile(path, Buffer.from(frame.data, 'base64'));
    };
    await capture(
      '../docs/screenshots/cherry-blossom-festival-dc/' + version + '-' + name + '.jpg',
    );
    if (version === 'after' && (name === 'jefferson' || name === 'blossoms')) {
      const asset =
        name === 'jefferson'
          ? 'cherry-blossom-festival-dc-photo.jpg'
          : 'cherry-blossom-festival-dc.jpg';
      const hidden = await page.addStyleTag({
        content: '.race > :not(.race-scene) { visibility: hidden !important; }',
      });
      await page.clock.runFor(34);
      await capture('projects/ride/public/maps/' + asset);
      await hidden.evaluate((style) => style.parentNode?.removeChild(style));
    }
  }
  await cdp.detach();
});

test('Sunrise on the Jefferson Memorial shore', async ({ api, bluetooth, page, worldRide }) => {
  test.skip(
    process.env['CHERRYBLOSSOM_CAPTURE'] === 'before',
    'The original course offers daylight only.',
  );
  await worldRide.pin('low', 'webgl2');
  const race = await startRace(
    page,
    bluetooth,
    api,
    cherryBlossomCourseMap.id,
    'mode=solo&light=sunrise',
    {
      catalogue: [cherryBlossomCourseMap],
      world: true,
    },
  );
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  while (parseFloat((await race.distance.textContent())!) < 0.56) {
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
    await page.clock.fastForward(1000);
  }
  await page.clock.runFor(34);
  const cdp = await page.context().newCDPSession(page);
  const image = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 91 });
  await writeFile(
    '../docs/screenshots/cherry-blossom-festival-dc/sunrise-jefferson.jpg',
    Buffer.from(image.data, 'base64'),
  );
  await cdp.detach();
});

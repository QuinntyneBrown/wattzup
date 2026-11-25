import { mkdir, writeFile } from 'node:fs/promises';
import { brightonCourseMap } from '../fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { startRace, stepUntil } from '../fixtures/race';
import { expect, test } from '../fixtures/test';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

test('Ride Madeira Drive past Brighton Pride to the Palace Pier', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  await worldRide.pin('low', 'webgl2');
  const race = await startRace(page, bluetooth, api, brightonCourseMap.id, 'mode=solo', {
    catalogue: [brightonCourseMap],
    world: true,
  });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  test.setTimeout(10 * 60_000);
  const cdp = await page.context().newCDPSession(page);
  await mkdir('../docs/screenshots/brighton-pride', { recursive: true });
  const version = process.env['BRIGHTON_CAPTURE'] ?? 'after';
  for (const [name, km] of [
    ['madeira', 0.065],
    ['arches', 0.432],
    ['parade', 0.85],
    ['railway', 1.24],
    ['pier', 1.71],
    ['regency', 2.85],
    ['pod', 6.35],
  ] as const) {
    const subset = process.env['BRIGHTON_VIEWS']?.split(',');
    if (subset && !subset.includes(name)) continue;
    while (parseFloat((await race.distance.textContent())!) < km) {
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
      // The baseline integrates distance on animation frames and caps each step at
      // 250 ms. Keep it in step with the HUD when advancing the simulated clock.
      if (version === 'before') {
        for (let frame = 0; frame < 5; frame++) await page.clock.fastForward(200);
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
    await capture('../docs/screenshots/brighton-pride/' + version + '-' + name + '.jpg');
    if (version === 'after' && (name === 'parade' || name === 'pier')) {
      const asset = name === 'parade' ? 'brighton-pride-photo.jpg' : 'brighton-pride.jpg';
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

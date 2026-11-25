import { mkdir, writeFile } from 'node:fs/promises';
import { ibizaCourseMap } from '../fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { startRace, stepUntil } from '../fixtures/race';
import { expect, test } from '../fixtures/test';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

test('Follow the Sant Antoni sunset strip from its terraces to Conillera', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  await worldRide.pin('low', 'webgl2');
  const race = await startRace(page, bluetooth, api, ibizaCourseMap.id, 'mode=solo', {
    catalogue: [ibizaCourseMap],
    world: true,
  });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  test.setTimeout(25 * 60_000);
  const cdp = await page.context().newCDPSession(page);
  // CDP screenshots inherit the desktop backing scale in headed Chromium on Retina.
  // Calibrate the capture against the emulated viewport once, with the race clock held.
  const calibration = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const viewport = page.viewportSize()!;
  const scale = viewport.width / Buffer.from(calibration.data, 'base64').readUInt32BE(16);
  const clip = { x: 0, y: 0, width: viewport.width, height: viewport.height, scale };
  await mkdir('../docs/screenshots/ibiza-sunset-strip', { recursive: true });
  const version = process.env['IBIZA_CAPTURE'] ?? 'after';
  for (const [name, km] of [
    ['grid', 0.08],
    ['letters', 0.35],
    ['cove', 0.96],
    ['dj', 3.06],
    ['festoon', 7.42],
    ['conillera', 8.22],
  ] as const) {
    while (parseFloat((await race.distance.textContent())!) < km) {
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
      // The baseline integrates distance on animation frames and caps each step at
      // 250 ms. Keep it in step with the HUD when advancing the simulated clock.
      for (let frame = 0; frame < 4; frame++) await page.clock.fastForward(250);
    }
    // Capture the submitted frame with the ride clock held at this chainage. Resuming
    // for a screenshot lets a loaded browser travel metres beyond the reference position.
    await page.clock.runFor(50);
    if (version === 'after') {
      const physical = await page.evaluate(
        () =>
          (window as unknown as { __wzWorldRide: { course: { metres: number } } }).__wzWorldRide
            .course.metres,
      );
      expect(Math.abs(physical - km * 1000)).toBeLessThan(28);
    }
    const capture = async (path: string): Promise<void> => {
      const frame = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 91, clip });
      await writeFile(path, Buffer.from(frame.data, 'base64'));
    };
    await capture('../docs/screenshots/ibiza-sunset-strip/' + version + '-' + name + '.jpg');
    if (version === 'after' && (name === 'conillera' || name === 'grid')) {
      const asset = name === 'conillera' ? 'photo-conillera.jpg' : 'photo-grid.jpg';
      const hidden = await page.addStyleTag({
        content: '.race > :not(.race-scene) { visibility: hidden !important; }',
      });
      await page.clock.runFor(34);
      await capture('../docs/screenshots/ibiza-sunset-strip/' + asset);
      await hidden.evaluate((style) => style.parentNode?.removeChild(style));
    }
  }
  await cdp.detach();
});

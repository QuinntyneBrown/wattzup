import { mkdir, writeFile } from 'node:fs/promises';
import { sellaRondaCourseMap } from '../fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { startRace, stepUntil } from '../fixtures/race';
import { expect, test } from '../fixtures/test';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

test('Ride the four Dolomite passes from Corvara beneath the Sella massif', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  await worldRide.pin('low', 'webgl2');
  const race = await startRace(page, bluetooth, api, sellaRondaCourseMap.id, 'mode=solo', {
    catalogue: [sellaRondaCourseMap],
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
  await mkdir('../docs/screenshots/sella-ronda', { recursive: true });
  const version = process.env['SELLARONDA_CAPTURE'] ?? 'after';
  for (const [name, km] of [
    ['corvara', 0.2],
    ['campolongo', 2.06],
    ['arabba', 3.08],
    ['pordoi', 4.9],
    ['sella', 7.7],
    ['gardena', 10.1],
  ] as const) {
    // Both versions are native. Hold the clock at the measured rider position.
    const station = async () => ((await worldRide.courseMetres()) ?? 0) / 1000;
    while ((await station()) < km - 0.002) {
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
      if (km - (await station()) > 0.045) await page.clock.fastForward(750);
      await page.clock.runFor(64);
    }
    await page.clock.runFor(34);
    expect(Math.abs((await station()) - km)).toBeLessThan(0.018);
    const capture = async (path: string): Promise<void> => {
      const frame = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 91, clip });
      await writeFile(path, Buffer.from(frame.data, 'base64'));
    };
    await capture('../docs/screenshots/sella-ronda/' + version + '-' + name + '.jpg');
    if (version === 'after' && (name === 'gardena' || name === 'corvara')) {
      const asset = name === 'gardena' ? 'sella-ronda-photo.jpg' : 'sella-ronda.jpg';
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

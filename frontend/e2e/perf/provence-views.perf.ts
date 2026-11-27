import { mkdir, writeFile } from 'node:fs/promises';
import { provenceCourseMap } from '../fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { startRace, stepUntil } from '../fixtures/race';
import { expect, test } from '../fixtures/test';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

test('Ride the Valensole plateau past the lavender harvest and the village square', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  await worldRide.pin('low', 'webgl2');
  const race = await startRace(page, bluetooth, api, provenceCourseMap.id, 'mode=solo', {
    catalogue: [provenceCourseMap],
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
  await mkdir('../docs/screenshots/provence-lavender', { recursive: true });
  const version = process.env['PROVENCE_CAPTURE'] ?? 'after';
  for (const [name, km] of [
    ['d8', 0.08],
    ['mas', 3.31],
    ['hives', 6.44],
    ['harvest', 9.63],
    ['valensole', 13.72],
    ['puimoisson', 17.96],
  ] as const) {
    const station = async () =>
      version === 'after'
        ? ((await worldRide.coursePose('provenceStation')) ?? 0) / 1000
        : parseFloat((await race.distance.textContent())!);
    while ((await station()) < km - (version === 'after' ? 0.002 : 0)) {
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
      // The baseline integrates distance on animation frames and caps each step at
      // 250 ms. Keep it in step with the HUD when advancing the simulated clock.
      if (version === 'before') {
        for (let frame = 0; frame < 4; frame++) await page.clock.fastForward(250);
      } else {
        // The authored course reads the same physical race distance as the HUD.
        const remaining = km - (await station());
        if (remaining < 0.045) await page.clock.runFor(100);
        else await page.clock.fastForward(1000);
      }
    }
    // Capture the submitted frame with the ride clock held at this chainage. Resuming
    // for a screenshot lets a loaded browser travel metres beyond the reference position.
    await page.clock.runFor(34);
    if (version === 'after') {
      await expect
        .poll(async () => {
          await page.clock.runFor(64);
          return Math.abs(((await worldRide.coursePose('provenceStation')) ?? -1000) - km * 1000);
        })
        .toBeLessThan(28);
      await page.clock.runFor(128);
    }
    const capture = async (path: string): Promise<void> => {
      const frame = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 91, clip });
      await writeFile(path, Buffer.from(frame.data, 'base64'));
    };
    await capture('../docs/screenshots/provence-lavender/' + version + '-' + name + '.jpg');
    if (version === 'after' && (name === 'puimoisson' || name === 'd8')) {
      const asset = name === 'puimoisson' ? 'provence-lavender-photo.jpg' : 'provence-lavender.jpg';
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

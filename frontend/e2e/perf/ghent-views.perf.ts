import { mkdir, writeFile } from 'node:fs/promises';
import { ghentCourseMap } from '../fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { startRace, stepUntil } from '../fixtures/race';
import { expect, test } from '../fixtures/test';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

test('Race the banked Kuipke under the lights of the Ghent Six-Day', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  await worldRide.pin('low', 'webgl2');
  const race = await startRace(page, bluetooth, api, ghentCourseMap.id, 'mode=solo', {
    catalogue: [ghentCourseMap],
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
  await mkdir('../docs/screenshots/ghent-six-day', { recursive: true });
  const version = process.env['GHENT_CAPTURE'] ?? 'after';
  for (const [name, km] of [
    ['boards', 0.014],
    ['bank', 0.045],
    ['bars', 0.087],
    ['board', 0.148],
    ['madison', 0.537],
    ['night', 4.422],
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
    if (version === 'after') {
      const hudMetres = parseFloat((await race.distance.textContent())!) * 1000;
      // The HUD rounds to .01 km. Capture once the world has actually drawn that part of the lap.
      await stepUntil(page, async () => {
        const submitted = await worldRide.ghentMotion('riddenMetres');
        expect(submitted).not.toBeNull();
        expect(Math.abs(submitted! - hudMetres)).toBeLessThan(14);
      });
    }
    const capture = async (path: string): Promise<void> => {
      // Surface snapshots are asynchronous in headed Metal. Flush the compositor after the HUD and GPU agree.
      await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 45, clip });
      const frame = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 91, clip });
      await writeFile(path, Buffer.from(frame.data, 'base64'));
    };
    await capture('../docs/screenshots/ghent-six-day/' + version + '-' + name + '.jpg');
    if (version === 'after' && (name === 'night' || name === 'boards')) {
      const asset = name === 'night' ? 'ghent-six-day-photo.jpg' : 'ghent-six-day.jpg';
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

import { mkdir, writeFile } from 'node:fs/promises';
import { sambadromeCourseMap } from '../fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { startRace, stepUntil } from '../fixtures/race';
import { expect, test } from '../fixtures/test';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

test('Race the samba schools down Marquês de Sapucaí to the Praça da Apoteose', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  await worldRide.pin('low', 'webgl2');
  const race = await startRace(page, bluetooth, api, sambadromeCourseMap.id, 'mode=solo', {
    catalogue: [sambadromeCourseMap],
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
  await mkdir('../docs/screenshots/rio-sambadrome', { recursive: true });
  const version = process.env['SAMBADROME_CAPTURE'] ?? 'after';
  for (const [name, km] of [
    ['sapucai', 0.08],
    ['alas', 0.21],
    ['carros', 0.34],
    ['bateria', 2.34],
    ['bandeira', 4.29],
    ['apoteose', 6.25],
  ] as const) {
    const station = async () =>
      version === 'after'
        ? ((await worldRide.coursePose('sambadromeStation')) ?? 0) / 1000
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
          return Math.abs(((await worldRide.coursePose('sambadromeStation')) ?? -1000) - km * 1000);
        })
        .toBeLessThan(28);
      await page.clock.runFor(128);
    }
    const capture = async (path: string): Promise<void> => {
      const frame = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 91, clip });
      await writeFile(path, Buffer.from(frame.data, 'base64'));
    };
    await capture('../docs/screenshots/rio-sambadrome/' + version + '-' + name + '.jpg');
    if (version === 'after' && (name === 'apoteose' || name === 'sapucai')) {
      const asset = name === 'apoteose' ? 'rio-sambadrome-photo.jpg' : 'rio-sambadrome.jpg';
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

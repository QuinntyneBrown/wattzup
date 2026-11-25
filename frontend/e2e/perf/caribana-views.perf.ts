import { mkdir, writeFile } from 'node:fs/promises';
import { caribanaCourseMap } from '../fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from '../fixtures/echelon';
import { startRace, stepUntil } from '../fixtures/race';
import { expect, test } from '../fixtures/test';

test.use({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

test('Ride Lake Shore Boulevard through the Toronto Caribbean Carnival', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  await worldRide.pin('low', 'webgl2');
  const race = await startRace(page, bluetooth, api, caribanaCourseMap.id, 'mode=solo', {
    catalogue: [caribanaCourseMap],
    world: true,
  });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  test.setTimeout(10 * 60_000);
  const cdp = await page.context().newCDPSession(page);
  await mkdir('../docs/screenshots/caribana-parade', { recursive: true });
  const version = process.env['CARIBANA_CAPTURE'] ?? 'after';
  for (const [name, km] of [
    ['opening', 0.035],
    ['band', 0.175],
    ['waterfront', 0.32],
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
    await page.clock.runFor(34);
    const capture = async (path: string): Promise<void> => {
      const frame = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 91 });
      await writeFile(path, Buffer.from(frame.data, 'base64'));
    };
    await capture('../docs/screenshots/caribana-parade/' + version + '-' + name + '.jpg');
    if (version === 'after' && (name === 'band' || name === 'waterfront')) {
      const asset = name === 'band' ? 'caribana-parade-photo.jpg' : 'caribana-parade.jpg';
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

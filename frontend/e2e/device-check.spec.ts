// Acceptance test
// Traces to: L2-162 AC1, AC2, AC3, AC4, AC6
// Description: "Check this device" rides a test world off screen at each level from the top the graphics API allows
// downward and stops at the first that holds the display's frame rate. While it runs it reads the level and time left,
// the percentage and what the levels tried held; when it finishes it reads the level found, where Auto now starts and
// when, and keeps the result on this device, where Auto then starts a world. A fixed level is unchanged. Stopped, or
// with the tab hidden, it draws no more and keeps nothing. The world draws in software here and the paused clock steps
// each frame, so a frame's time is the step: 30 ms frames hold 33 fps, 16 ms frames hold the display's 60. Each trial
// rides 1 second instead of 30 (`shortTrials`), in a phone's small window, so each software frame is cheap.
import type { Page } from '@playwright/test';
import { shortTrials } from './fixtures/device-check';
import { worldRideMap } from './fixtures/maps';
import { startRace, stepUntil } from './fixtures/race';
import { storeSettings, storedSettings } from './fixtures/settings-storage';
import { hideTab, showTab } from './fixtures/tab';
import { expect, test } from './fixtures/test';
import { SettingsPage } from './pages/settings.page';

/** 7:31 PM on the day of the check, in the specs' time zone (UTC). */
const CHECKED_AT = new Date('2026-11-22T19:31:00Z');

/**
 * Steps the paused clock one frame of `ms` at a time until `shown` holds: `fastForward` fires the frame once, where
 * `runFor` would fire one every 16 ms of it.
 */
async function frameUntil(page: Page, ms: number, shown: () => Promise<void>): Promise<void> {
  await expect(async () => {
    await page.clock.fastForward(ms);
    await shown();
  }).toPass({ intervals: [0], timeout: 150_000 });
}

/**
 * Opens Settings at World with the clock paused at 7:31 PM, in a small window: the check draws the window's size, and
 * in software a frame costs its pixels.
 */
async function openWorld(page: Page): Promise<SettingsPage> {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.clock.install({ time: CHECKED_AT });
  await page.clock.pauseAt(CHECKED_AT);
  const settings = new SettingsPage(page);
  await settings.open('world');
  await stepUntil(page, () => expect(settings.check).toBeVisible({ timeout: 50 }));
  return settings;
}

test.describe('check this device', () => {
  // The test world draws in software at two levels, every frame of it; 4 minutes allows the slowest machine its frames.
  test.setTimeout(240_000);

  test('the check tries High, then Medium, finds Medium holds 60 fps and keeps it, and Auto then starts there (L2-162 AC1, AC2, AC3)', async ({
    page,
    webgl,
  }) => {
    await webgl.withoutWebGpu();
    await shortTrials(page, 1);
    const settings = await openWorld(page);
    await expect(settings.checkHint).toHaveText(
      'Rides 30 seconds of a test world off screen at each level and picks the best one that holds 60 fps.',
    );

    // WebGL 2 allows High at most, so the check starts there; Ultra needs WebGPU.
    await settings.check.click();
    await frameUntil(page, 16, () =>
      expect(settings.checkPercent).not.toHaveText('0%', { timeout: 50 }),
    );
    await expect(settings.checkLabel).toHaveText('Trying High · 1 s left');
    await expect(settings.checkFoot).toHaveText('Keep this tab open; the check rides off screen.');
    await expect(settings.stopCheck).toBeVisible();

    // High's frames come 30 ms apart: 33 fps does not hold 60, so the check moves down to Medium.
    await frameUntil(page, 30, () =>
      expect(settings.checkLabel).toHaveText('Trying Medium · 1 s left', { timeout: 50 }),
    );
    await expect(settings.checkFoot).toHaveText(
      'High held 33 fps. Keep this tab open; the check rides off screen.',
    );
    const percent = Number((await settings.checkPercent.textContent())?.replace('%', ''));
    expect(percent).toBeGreaterThanOrEqual(33);
    await expect(settings.checkProgress).toHaveAttribute('aria-valuenow', String(percent));

    // Medium's frames come every 16 ms, as the display's: it holds, and the check stops there.
    await frameUntil(page, 16, () => expect(settings.checkResult).toBeVisible({ timeout: 50 }));
    await expect(settings.checkResult).toHaveText(
      'Medium holds 60 fps on this device. Auto now starts at Medium here. High held 33 fps. Checked today at 7:31 PM.',
    );
    await expect(settings.checkAgain).toBeVisible();
    expect(await storedSettings(page)).toMatchObject({
      quality: 'auto',
      deviceCheck: { level: 'medium', displayFps: 60, tried: [{ level: 'high', fps: 33 }] },
    });

    // Kept on this device: the result is there after a reload.
    await page.reload();
    await stepUntil(page, () => expect(settings.checkResult).toBeVisible({ timeout: 50 }));
    await expect(settings.checkResult).toHaveText(
      'Medium holds 60 fps on this device. Auto now starts at Medium here. High held 33 fps. Checked today at 7:31 PM.',
    );
  });

  test('stopped, or with the tab hidden, the check draws no more and keeps no result (L2-162 AC6)', async ({
    page,
    webgl,
  }) => {
    await webgl.withoutWebGpu();
    await webgl.countDraws();
    await shortTrials(page, 1);
    const settings = await openWorld(page);

    await settings.check.click();
    await frameUntil(page, 16, () =>
      expect(settings.checkPercent).not.toHaveText('0%', { timeout: 50 }),
    );
    await settings.stopCheck.click();
    await stepUntil(page, () => expect(settings.check).toBeVisible({ timeout: 50 }));
    const stopped = await webgl.draws();
    for (let frame = 0; frame < 30; frame++) await page.clock.runFor(16);
    expect(await webgl.draws()).toBe(stopped);
    expect(await storedSettings(page)).toBeNull();

    await settings.check.click();
    await frameUntil(page, 16, () =>
      expect(settings.checkPercent).not.toHaveText('0%', { timeout: 50 }),
    );
    await hideTab(page);
    await page.clock.runFor(100);
    await showTab(page);
    await stepUntil(page, () => expect(settings.check).toBeVisible({ timeout: 50 }));
    const hidden = await webgl.draws();
    for (let frame = 0; frame < 30; frame++) await page.clock.runFor(16);
    expect(await webgl.draws()).toBe(hidden);
    expect(await storedSettings(page)).toBeNull();
  });
});

test.describe('the race world starts where the check found', () => {
  test.setTimeout(180_000);

  const checked = {
    level: 'medium',
    displayFps: 60,
    tried: [{ level: 'high', fps: 33 }],
    checkedAt: CHECKED_AT.toISOString(),
  };

  // CI's critical path for the check: building the test world in software twice takes CI four minutes (L202).
  test('with Auto, the world opens at the level the check found (L2-159 AC4, L2-162 AC3) @critical', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
  }) => {
    await storeSettings(page, JSON.stringify({ quality: 'auto', deviceCheck: checked }));
    await webgl.withoutWebGpu();
    await worldRide.watch();
    const race = await startRace(page, bluetooth, api, worldRideMap.id, 'mode=solo', {
      world: true,
      catalogue: [worldRideMap],
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
    expect((await worldRide.report())?.tier).toBe('medium');
  });

  test('with a fixed level, the check changes nothing: the world opens at that level (L2-162 AC4)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
  }) => {
    await storeSettings(page, JSON.stringify({ quality: 'low', deviceCheck: checked }));
    await webgl.withoutWebGpu();
    await worldRide.watch();
    const race = await startRace(page, bluetooth, api, worldRideMap.id, 'mode=solo', {
      world: true,
      catalogue: [worldRideMap],
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
    expect((await worldRide.report())?.tier).toBe('low');
  });
});

// Acceptance test
// Traces to: L2-159 AC5, L2-160 AC2, AC4, AC5
// Description: the race's world follows the rider's World settings. A fixed level opens the world at that level; with
// Step down when frames drop off, two slow windows in a row leave it there. At 30 fps the world draws at most 30
// frames a second; at 50 % resolution its drawing buffer has half the pixels across while the HUD stays as it is. The
// world draws in software here, so each spec draws as few frames as it needs; `main`'s test-only hook reports the level
// and frames drawn, and nothing reads a pixel (ADR 0021). Auto's Low start and step-down are in race-world-quality and
// race-world-step-down.
import type { Page } from '@playwright/test';
import { worldRideMap } from './fixtures/maps';
import { startRace, stepUntil } from './fixtures/race';
import { storeSettings } from './fixtures/settings-storage';
import { expect, test } from './fixtures/test';

/** Draws `seconds` of frames, each `ms` after the one before. */
async function frames(page: Page, ms: number, seconds: number): Promise<void> {
  for (let elapsed = 0; elapsed < seconds * 1000; elapsed += ms) await page.clock.fastForward(ms);
}

test.describe('the race world follows the World settings', () => {
  // The world draws in software, every frame of it; 3 minutes allows the slowest machine its frames.
  test.setTimeout(180_000);

  test('a fixed level opens the world there, and with step-down off slow frames never lower it (L2-159 AC5, L2-160 AC2)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
  }) => {
    await storeSettings(page, JSON.stringify({ quality: 'medium', stepDown: false }));
    await webgl.withoutWebGpu();
    await worldRide.watch();
    const race = await startRace(page, bluetooth, api, worldRideMap.id, 'mode=solo', {
      world: true,
      catalogue: [worldRideMap],
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
    expect((await worldRide.report())?.tier).toBe('medium');

    // 25 ms frames: two windows over 1.2 × the 16.7 ms period, which would drop a judged level (race-world-step-down).
    await frames(page, 25, 4.3);
    expect((await worldRide.report())?.tier).toBe('medium');
  });

  test('at 30 fps and 50 % resolution the world draws at most 30 frames a second with half the pixels across (L2-160 AC4, AC5)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
  }) => {
    await storeSettings(page, JSON.stringify({ frameRate: '30', resolution: 50 }));
    await webgl.withoutWebGpu();
    await worldRide.watch();
    const race = await startRace(page, bluetooth, api, worldRideMap.id, 'mode=solo', {
      world: true,
      catalogue: [worldRideMap],
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));

    const size = await race.world.evaluate((canvas: HTMLCanvasElement) => ({
      buffer: canvas.width,
      shown: canvas.clientWidth,
    }));
    expect(size.buffer).toBe(Math.round(size.shown * 0.5));

    // The display offers a frame every 16 ms; the world takes every other one.
    await frames(page, 16, 1);
    const drawn = (await worldRide.report())?.frames.slice(-10) ?? [];
    expect(drawn).toHaveLength(10);
    for (const interval of drawn) expect(interval).toBeGreaterThanOrEqual(32);
  });
});

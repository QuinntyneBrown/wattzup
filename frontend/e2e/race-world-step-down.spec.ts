// Acceptance test
// Traces to: L2-159 AC4; L2-136 AC3
// Description: the world judges its frames against the display's frame period, measured as it starts (16.7 ms here).
// After two 2-second windows in a row whose median frame is over 1.2 × that period, it drops one quality level for the
// rest of the race, and fast frames never raise it again; when the second slow window's median is 3 × the period or
// more, it drops straight to Low. The paused clock makes frames slow: `fastForward` fires the next animation frame once,
// that many milliseconds after the last. `main`'s test-only hook opens the world at a level, judged as a rider's ride
// is, and reports the level drawn; nothing reads a pixel (ADR 0021). The world draws in software here, so each spec
// draws as few frames as it needs: one level down from Medium, and straight to Low from High; `main`'s unit specs
// hold the rule's table of frame times and periods.
import type { Page } from '@playwright/test';
import type { ApiFixture } from './fixtures/api';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { worldRideMap } from './fixtures/maps';
import { startRace, stepUntil } from './fixtures/race';
import { expect, test } from './fixtures/test';
import type { FakeWebGl } from './fixtures/webgl';
import type { Tier, WorldRideProbe } from './fixtures/world-ride-probe';

/** Draws `seconds` of frames, each `ms` after the one before. */
async function frames(page: Page, ms: number, seconds: number): Promise<void> {
  for (let elapsed = 0; elapsed < seconds * 1000; elapsed += ms) await page.clock.fastForward(ms);
}

interface Fixtures {
  readonly page: Page;
  readonly bluetooth: FakeBluetooth;
  readonly api: ApiFixture;
  readonly webgl: FakeWebGl;
  readonly worldRide: WorldRideProbe;
}

const level = async (worldRide: WorldRideProbe) => (await worldRide.report())?.tier;

test.describe('the race world steps down when frames drop', () => {
  // The world draws in software, every frame of it; 3 minutes allows the slowest machine its frames.
  test.setTimeout(180_000);

  async function open(
    { page, bluetooth, api, webgl, worldRide }: Fixtures,
    tier: Tier,
  ): Promise<void> {
    await webgl.withoutWebGpu();
    await worldRide.open(tier);
    const race = await startRace(page, bluetooth, api, worldRideMap.id, 'mode=solo', {
      world: true,
      catalogue: [worldRideMap],
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  }

  test('drops one level after two slow windows, and never raises it again (L2-159 AC4)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
  }) => {
    await open({ page, bluetooth, api, webgl, worldRide }, 'medium');

    // 25 ms frames: 1.5 × the period, over 1.2 × and under 3 ×. One slow window keeps the level.
    await frames(page, 25, 2.1);
    expect(await level(worldRide)).toBe('medium');

    await frames(page, 25, 2.1);
    expect(await level(worldRide)).toBe('low');

    // A window of fast frames closes, and the level stays down for the rest of the race.
    await frames(page, 16, 2.1);
    expect(await level(worldRide)).toBe('low');
  });

  test('drops straight to Low, past Medium, when the second slow window is 3 × the frame period (L2-159 AC4)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
  }) => {
    await open({ page, bluetooth, api, webgl, worldRide }, 'high');

    await frames(page, 60, 4.3);

    expect(await level(worldRide)).toBe('low');
  });
});

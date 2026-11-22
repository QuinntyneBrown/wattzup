// Acceptance test
// Traces to: L2-065 AC3; L2-133
// Description: while the tab is hidden, the race's world draws no frame, though the race clock and the bike's numbers
// carry on; shown again, the world draws once more. `main`'s test-only hook reports every frame the renderer draws, at
// Low, so nothing reads a pixel (ADR 0021).
import type { Page } from '@playwright/test';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { worldRideMap } from './fixtures/maps';
import { startRace, stepUntil } from './fixtures/race';
import { hideTab, showTab } from './fixtures/tab';
import { expect, test } from './fixtures/test';
import type { WorldRideProbe } from './fixtures/world-ride-probe';

/** Frames the renderer has drawn since the ride began. */
const drawn = async (worldRide: WorldRideProbe) => (await worldRide.report())?.frames.length ?? 0;

/** Rides `rpm` for `seconds`, a frame from the bike every second, as a hidden tab's timers still run. */
async function ride(page: Page, bluetooth: Parameters<typeof startRace>[1], seconds: number) {
  for (let second = 0; second < seconds; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
    await page.clock.runFor(1000);
  }
}

test.describe('the race world and a hidden tab', () => {
  test.slow();

  test('draws no frame while the tab is hidden, and the race runs on (L2-065 AC3)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
  }) => {
    await webgl.withoutWebGpu();
    await worldRide.pin('low');
    const race = await startRace(page, bluetooth, api, worldRideMap.id, 'mode=solo', {
      world: true,
      catalogue: [worldRideMap],
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(16));
    await ride(page, bluetooth, 1);
    const clock = await race.clock.textContent();

    await hideTab(page);
    const before = await drawn(worldRide);
    await ride(page, bluetooth, 5);

    expect(await drawn(worldRide), 'frames drawn while hidden').toBe(before);
    await expect(race.clock).not.toHaveText(clock!);
  });

  test('draws again once the tab is shown (L2-065 AC3)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
  }) => {
    await webgl.withoutWebGpu();
    await worldRide.pin('low');
    const race = await startRace(page, bluetooth, api, worldRideMap.id, 'mode=solo', {
      world: true,
      catalogue: [worldRideMap],
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
    await hideTab(page);
    await ride(page, bluetooth, 2);
    const hidden = await drawn(worldRide);

    await showTab(page);

    await stepUntil(page, async () => expect(await drawn(worldRide)).toBeGreaterThan(hidden));
  });
});

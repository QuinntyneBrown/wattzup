// Acceptance test
// Traces to: L2-064 AC1; L2-068 AC1
// Description: the race draws the map's world, `main`'s scene of road, terrain and sky, and the camera moves forward
// with the rider: two pictures of the world a few seconds of riding apart differ. A paused solo race holds its world
// still. Comparing two pictures of the same canvas reads no pixel's colour (ADR 0021). The world draws in software
// here, so `main`'s test hook pins it at low, its cheapest tier, as `main`'s own scene specs do.
import type { Locator, Page } from '@playwright/test';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { worldRideMap } from './fixtures/maps';
import { startRace, stepUntil } from './fixtures/race';
import { expect, test } from './fixtures/test';

/** Rides `rpm` for a second: every frame of it draws the world, so a spec rides no longer than it must. */
async function ride(page: Page, bluetooth: FakeBluetooth, rpm: number): Promise<void> {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(16));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(rpm));
  await page.clock.runFor(1000);
}

/**
 * A picture of the world alone: the HUD's panels over it are hidden for the screenshot (its clock and watts move on
 * their own), and a screenshot waits on frames the paused clock holds back, so the clock steps meanwhile.
 */
async function picture(page: Page, canvas: Locator): Promise<Buffer> {
  await page.addStyleTag({
    content: '.race > :not(.race-scene) { visibility: hidden !important; }',
  });
  let done = false;
  const taken = canvas.screenshot().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return taken;
}

test.describe('the race world', () => {
  // The scene is drawn in software here, and compiles every tier's programs while it loads.
  test.slow();

  test("draws the map's world and moves it forward as the rider rides (L2-064 AC1)", async ({
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
    await ride(page, bluetooth, 90);
    const first = await picture(page, race.world);

    await ride(page, bluetooth, 90);

    expect((await picture(page, race.world)).equals(first)).toBe(false);
  });

  test('holds the world still while a solo race is paused (L2-068 AC1)', async ({
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
    await ride(page, bluetooth, 90);
    await race.pause.click();
    await page.clock.runFor(100);
    const first = await picture(page, race.world);

    await page.clock.runFor(1000);

    expect((await picture(page, race.world)).equals(first)).toBe(true);
  });
});

import type { Page } from '@playwright/test';
import { connectBike, RIDE_START } from './class-ride';
import { echelonBike, targetResistanceWrite } from './echelon';
import type { FakeBluetooth } from './fake-bluetooth';
import { expect } from './test';
import { CustomRidePage } from '../pages/custom-ride.page';
import { CustomWorkoutPage } from '../pages/custom-workout.page';

/**
 * Opens Custom workout with the remembered Echelon, lets `setUp` change the workout, and starts the ride on
 * Playwright's paused clock: once the bike is connected the clock is paused and the spec presses Start ride, so the
 * ride starts at a known time and the spec moves it on by hand. Resolves once the ride's first command (`first`, the
 * warm-up's level 8 by default) has gone and the page has rendered.
 */
export async function startCustomRide(
  page: Page,
  bluetooth: FakeBluetooth,
  {
    setUp = async () => undefined,
    first = 8,
  }: { setUp?: (custom: CustomWorkoutPage) => Promise<void>; first?: number } = {},
): Promise<CustomRidePage> {
  await page.clock.install({ time: RIDE_START });
  await bluetooth.remember(echelonBike);
  const custom = new CustomWorkoutPage(page);
  await custom.open();
  await connectBike(bluetooth);
  await setUp(custom);
  await expect(custom.startRide).toBeEnabled();
  await page.clock.pauseAt(RIDE_START + 60_000);
  await custom.startRide.click();
  await page.clock.runFor(1);
  await expect
    .poll(() => bluetooth.writes().map((write) => write.hex))
    .toContain(targetResistanceWrite(first));
  await page.clock.runFor(100);
  return new CustomRidePage(page);
}

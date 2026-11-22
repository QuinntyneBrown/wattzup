import type { Page } from '@playwright/test';
import { catalogue, hiitCardio } from './classes';
import { ECHELON_INITIALISED, echelonBike, targetResistanceWrite } from './echelon';
import type { ApiFixture } from './api';
import type { FakeBluetooth } from './fake-bluetooth';
import { expect } from './test';
import { ClassRidePage } from '../pages/class-ride.page';
import { WorldLoadingPage } from '../pages/world-loading.page';
import { FakeWebGl } from './webgl';

/** When a class ride spec's clock starts; the ride itself starts a minute later, on a paused clock. */
export const RIDE_START = new Date('2026-11-21T18:00:00Z').getTime();

/**
 * Opens 30 Minute HIIT Cardio solo with the remembered Echelon and starts it on Playwright's paused clock: World loading
 * gets the class's world ready on the running clock (as a panorama: these specs ride the class, not its world, so no 3D
 * is built), and once the bike is initialised the clock is paused and the spec presses Start riding, so the ride starts
 * at a known time and the spec moves it on by hand. Change detection waits on a timer, so the paused clock is stepped
 * for the ride to render. Resolves once the ride's first command has gone and the page has rendered.
 */
export async function startClassRide(
  page: Page,
  bluetooth: FakeBluetooth,
  api: ApiFixture,
): Promise<ClassRidePage> {
  api.answer('GET', '/api/classes', catalogue);
  await new FakeWebGl(page).disable();
  await page.clock.install({ time: RIDE_START });
  await bluetooth.remember(echelonBike);
  const ride = new ClassRidePage(page);
  await ride.open(hiitCardio.id);
  await expect.poll(() => bluetooth.log()).toEqual(ECHELON_INITIALISED);
  const loading = new WorldLoadingPage(page);
  await expect(loading.start).toBeEnabled();
  await page.clock.pauseAt(RIDE_START + 60_000);
  await loading.start.click();
  await page.clock.runFor(1);
  // The ride starts the moment the rider presses Start riding, and its first command shows it has.
  await expect
    .poll(() => bluetooth.writes().map((write) => write.hex))
    .toContain(targetResistanceWrite(8));
  await page.clock.runFor(100);
  return ride;
}

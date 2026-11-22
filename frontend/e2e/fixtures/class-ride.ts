import type { Page } from '@playwright/test';
import { catalogue, hiitCardio } from './classes';
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  echelonBike,
  resistanceFrame,
  targetResistanceWrite,
} from './echelon';
import type { ApiFixture } from './api';
import type { FakeBluetooth } from './fake-bluetooth';
import { expect } from './test';
import { ClassRidePage } from '../pages/class-ride.page';
import { WorldLoadingPage } from '../pages/world-loading.page';
import { FakeWebGl } from './webgl';

/** When a class ride spec's clock starts; the ride itself starts a minute later, on a paused clock. */
export const RIDE_START = new Date('2026-11-21T18:00:00Z').getTime();

/**
 * Connects the remembered Echelon: once its latest initialisation has gone (a reload starts it again), it reports its
 * resistance, so `ble` is connected and Start riding can turn on (L2-157 AC3).
 */
export async function connectBike(bluetooth: FakeBluetooth): Promise<void> {
  await expect
    .poll(() => bluetooth.log().slice(-ECHELON_INITIALISED.length))
    .toEqual(ECHELON_INITIALISED);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
}

/**
 * Opens 30 Minute HIIT Cardio solo with the remembered Echelon and starts it on Playwright's paused clock: World loading
 * gets the class's world ready on the running clock (as a panorama: these specs ride the class, not its world, so no 3D
 * is built), and once the bike is connected the clock is paused and the spec presses Start riding, so the ride starts
 * at a known time and the spec moves it on by hand. Change detection waits on a timer, so the paused clock is stepped
 * for the ride to render. Resolves once the ride's first command has gone and the page has rendered. With `ride`, the
 * catalogue serves that class instead, on the same shelf.
 */
export async function startClassRide(
  page: Page,
  bluetooth: FakeBluetooth,
  api: ApiFixture,
  { ride: lesson = hiitCardio as { readonly id: string } } = {},
): Promise<ClassRidePage> {
  api.answer('GET', '/api/classes', { ...catalogue, classes: [lesson] });
  await new FakeWebGl(page).disable();
  await page.clock.install({ time: RIDE_START });
  await bluetooth.remember(echelonBike);
  const ride = new ClassRidePage(page);
  await ride.open(lesson.id);
  await connectBike(bluetooth);
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

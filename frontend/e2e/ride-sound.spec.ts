// Acceptance Test
// Traces to: L2-129
// Description: Ride sound starts off, and once on, its chain follows the pedalling, the freewheel
// runs down when the pedals stop, and a pause silences it.
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/wz-test';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { RidePage } from './pages/ride.page';
import { RideSoundDialog } from './pages/ride-sound.dialog';
import { SetupPage } from './pages/setup.page';

/** A workout-data frame with the cadence in bytes 9–10 (L2-007). */
const cadence = (rpm: number) =>
  `F0 D1 09 00 05 00 00 00 00 00 ${rpm.toString(16).padStart(2, '0').toUpperCase()} 00 1F`;

async function startRide(page: Page): Promise<RidePage> {
  const ride = new RidePage(page);
  const setup = new SetupPage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  await setup.open();
  await setup.startButton.click();
  await page.waitForURL(/\/$/);
  return ride;
}

async function turnOn(page: Page, ride: RidePage): Promise<void> {
  await ride.rideSoundButton.click();
  const dialog = new RideSoundDialog(page);
  await dialog.soundSwitch.check();
  await dialog.doneButton.click();
  await expect(dialog.dialog).toBeHidden();
}

/** Whether sounds keep starting over the next `ms`. */
async function sounding(audio: { starts(): Promise<number> }, ms = 1000): Promise<boolean> {
  const before = await audio.starts();
  await new Promise((r) => setTimeout(r, ms));
  return (await audio.starts()) > before;
}

async function pedal(bluetooth: FakeBluetooth, rpm: number): Promise<void> {
  await bluetooth.notify(cadence(rpm));
}

test('starts off, with no audio until the rider turns it on', async ({ page, audio }) => {
  const ride = await startRide(page);
  await expect(ride.rideSoundButton).toHaveAccessibleName('Ride sound off');
  await expect(ride.rideSoundButton).toHaveAttribute('aria-pressed', 'false');
  expect(await audio.contexts()).toBe(0);
});

test('ticks the chain while the rider pedals, once turned on', async ({
  page,
  audio,
  bluetooth,
}) => {
  const ride = await startRide(page);
  await turnOn(page, ride);
  await expect(ride.rideSoundButton).toHaveAccessibleName('Ride sound on');
  await expect(ride.rideSoundButton).toHaveAttribute('aria-pressed', 'true');
  await pedal(bluetooth, 90);
  await expect.poll(() => audio.running()).toBe(true);
  expect(await sounding(audio)).toBe(true);
});

test('freewheels for a few seconds when the pedals stop, then falls quiet', async ({
  page,
  audio,
  bluetooth,
}) => {
  const ride = await startRide(page);
  await turnOn(page, ride);
  await pedal(bluetooth, 90);
  await expect.poll(() => audio.running()).toBe(true);
  await pedal(bluetooth, 0);
  expect(await sounding(audio, 800)).toBe(true);
  await page.waitForTimeout(3000);
  expect(await sounding(audio)).toBe(false);
});

test('falls quiet when the ride is paused', async ({ page, audio, bluetooth }) => {
  const ride = await startRide(page);
  await turnOn(page, ride);
  await pedal(bluetooth, 90);
  await expect.poll(() => audio.running()).toBe(true);
  await ride.pauseButton.click();
  await expect(ride.resumeButton).toBeVisible();
  await page.waitForTimeout(600);
  expect(await sounding(audio)).toBe(false);
});

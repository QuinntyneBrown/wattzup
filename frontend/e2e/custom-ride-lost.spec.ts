// Acceptance test
// Traces to: L2-105 AC2, AC3
// Description: A custom ride whose bike stops answering pauses at once; the status reads Disconnected, Resume and every
// resistance control are disabled, and an alert offers Reconnect. When the bike is back, the ride stays paused until
// the rider presses Resume.
//
// Given a custom ride at 6:52, when the bike drops, then the clock holds at 6:52, the status reads "Disconnected", the
// alert reads "Lost the bike" and "Echelon EX-5s stopped answering. Wake it with a pedal stroke, then reconnect — your
// ride is saved at 6:52.", and Resume, Raise and the level bars are disabled.
// Given the lost bike, when the rider presses Reconnect and the bike answers, then the alert goes, the clock still
// reads 6:52 and Resume is enabled; pressing it carries the ride on.
import { startCustomRide } from './fixtures/custom-ride';
import { ECHELON_INITIALISED, ECHELON_NOTIFY, resistanceFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';

test('a lost bike pauses the ride until the rider resumes it (L2-105 AC2, AC3)', async ({
  page,
  bluetooth,
}) => {
  const ride = await startCustomRide(page, bluetooth);
  await page.clock.fastForward('06:52');
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  await page.clock.runFor(100);
  await expect(ride.clock).toHaveText('6:52 / 30:00');

  await bluetooth.switchOff();
  await bluetooth.drop();
  const afterDrop = bluetooth.log().length;
  await page.clock.runFor(100);

  await expect(ride.bike).toContainText('Disconnected');
  await expect(ride.overlay).toHaveRole('alert');
  await expect(ride.overlay).toContainText('Lost the bike');
  await expect(ride.overlay).toContainText(
    'Echelon EX-5s stopped answering. Wake it with a pedal stroke, then reconnect — your ride is saved at 6:52.',
  );
  await expect(ride.resume).toBeDisabled();
  await expect(ride.raise).toBeDisabled();
  await expect(ride.levels.nth(19)).toBeDisabled();
  await page.clock.runFor(9000);
  await expect(ride.clock).toHaveText('6:52 / 30:00');

  await bluetooth.switchOn();
  await ride.reconnect.click();
  await expect(async () => {
    await page.clock.runFor(100);
    expect(bluetooth.log().slice(afterDrop)).toEqual(ECHELON_INITIALISED);
  }).toPass();
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  await page.clock.runFor(2000);

  await expect(ride.overlay).toHaveCount(0);
  await expect(ride.bike).toContainText('Connected');
  await expect(ride.clock).toHaveText('6:52 / 30:00');
  await expect(ride.resume).toBeEnabled();
  await expect(ride.raise).toBeEnabled();

  await ride.resume.click();
  await page.clock.runFor(2000);
  await expect(ride.clock).toHaveText('6:54 / 30:00');
});

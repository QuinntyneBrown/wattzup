// Acceptance test
// Traces to: L2-106 AC1 to AC4
// Description: With no connected bike the custom ride waits at 0:00 behind "Connect your bike"; Connect bike opens the
// browser's chooser, the overlay closes once the bike is connected, and Start starts the ride.
//
// Given the remembered Echelon switched off, when the custom ride opens, then the clock reads 0:00, Start is disabled,
// Power reads "—" with "Target 143 W", Cadence "—" with "Aim for 80", the interval card Warm-up with 5:00, the level
// "—" with every resistance control disabled, no metric reports a ride, and the overlay reads "Connect your bike".
// Given the bike switched on, when the rider presses Connect bike, then the overlay closes and Start is enabled.
// Given Start, when the rider presses it, then the ride starts: level 8 is sent and the clock moves.
// Given Bluetooth switched off, when the custom ride opens, then the overlay reads "Turn on Bluetooth", and Check again
// shows "Connect your bike" once it is back on.
import { RIDE_START, connectBike } from './fixtures/class-ride';
import { echelonBike, targetResistanceWrite } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { CustomRidePage } from './pages/custom-ride.page';

test('with no bike the ride waits for Connect bike and Start (L2-106 AC1 to AC4)', async ({
  page,
  bluetooth,
}) => {
  await page.clock.install({ time: RIDE_START });
  await bluetooth.remember(echelonBike);
  await bluetooth.switchOff();
  const ride = new CustomRidePage(page);
  await ride.open();

  await expect(ride.overlay).toContainText('Connect your bike');
  await expect(ride.overlay).toContainText(
    'Wake the Echelon EX-5s with a few pedal strokes, then pick it from the list your browser shows. We’ll remember it next time.',
  );
  await expect(ride.overlay).toContainText(
    'Not in the list? Close the Echelon app on your phone — the bike talks to one device at a time.',
  );
  await expect(ride.clock).toHaveText('0:00 / 30:00');
  await expect(ride.start).toBeDisabled();
  await expect(ride.power).toHaveText('—');
  await expect(ride.powerFoot).toContainText('Target 143 W');
  await expect(ride.cadence).toHaveText('—');
  await expect(ride.cadenceFoot).toHaveText('Aim for 80');
  await expect(ride.intervalName).toHaveText('Warm-up');
  await expect(ride.countdown).toHaveText('5:00');
  await expect(ride.level).toHaveText('—');
  await expect(ride.raise).toBeDisabled();
  await expect(ride.levels.first()).toBeDisabled();
  await expect(ride.metricValues).toHaveText(['—bpm', '—W', '—km/h', '0.00km', '0kcal']);
  await page.clock.runFor(10_000);
  await expect(ride.clock).toHaveText('0:00 / 30:00');

  await bluetooth.switchOn();
  await ride.connectBike.click();
  await connectBike(bluetooth);
  await page.clock.runFor(100);
  await expect(ride.overlay).toHaveCount(0);
  await expect(ride.start).toBeEnabled();
  expect(bluetooth.writes().map((write) => write.hex)).not.toContain(targetResistanceWrite(8));

  await ride.start.click();
  await page.clock.runFor(1);
  await expect
    .poll(() => bluetooth.writes().map((write) => write.hex))
    .toContain(targetResistanceWrite(8));
  await page.clock.runFor(3000);
  await expect(ride.clock).toHaveText('0:03 / 30:00');
  await expect(ride.pause).toBeEnabled();
});

test('with Bluetooth off the overlay says to turn it on (L2-106 AC2)', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.adapterOff();
  const ride = new CustomRidePage(page);
  await ride.open();

  await expect(ride.overlay).toHaveRole('alert');
  await expect(ride.overlay).toContainText('Turn on Bluetooth');
  await expect(ride.bike).toContainText('Bluetooth is off');
  await expect(ride.start).toBeDisabled();

  await bluetooth.adapterOn();
  await ride.checkAgain.click();
  await expect(ride.overlay).toContainText('Connect your bike');
});

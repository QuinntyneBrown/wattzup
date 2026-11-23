// Acceptance test
// Traces to: L2-112 AC1, AC2
// Description: Profile's Settings lists the paired bike with its state and "diagnostics", "Ride settings" with
// "Quality, sound and display" to Settings, and "Custom workout" with "Build your own intervals" to Custom workout,
// before the display name, Sign out and Delete my account. With no bike paired, the bike row reads "No bike yet" and
// goes to Connect Bike. Diagnostics (slice 25.1), Settings (20.1) and Custom workout (21.1) are built by their slices.
import { ECHELON_NOTIFY, echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';
import { HomePage } from './pages/home.page';
import { ProfilePage } from './pages/profile.page';

/** A `D1` frame: 5 s, no revolutions, 80 rpm (docs/protocol/echelon-ble-frames.md). */
const WORKOUT_FRAME = [
  0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f,
];

test('Settings lists the bike, Ride settings and Custom workout before the account rows (L2-112 AC1) @critical', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike);
  const profile = new ProfilePage(page);
  await profile.open();

  await expect(profile.rowTitles).toHaveText([
    'Echelon EX-5s',
    'Ride settings',
    'Custom workout',
    'Display name',
    'Sign out',
    'Delete my account',
  ]);
  await expect(profile.rowBodies.first()).toHaveText('Not connected · diagnostics');

  // Home connects the remembered bike (L2-015); back on Profile the row says so.
  await profile.header.link('Home').click();
  await expect.poll(() => bluetooth.writes().length).toBe(3);
  await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
  await new HomePage(page).header.link('Profile').click();
  await expect(profile.bikeRow).toHaveAccessibleName('Echelon EX-5s Connected · diagnostics');

  await expect(profile.rideSettings).toHaveAccessibleName(
    'Ride settings Quality, sound and display',
  );
  await expect(profile.rideSettings).toHaveAttribute('href', '/settings');
  await expect(profile.customWorkout).toHaveAccessibleName(
    'Custom workout Build your own intervals',
  );
  await expect(profile.customWorkout).toHaveAttribute('href', '/profile/custom');
});

test('with no bike paired, the bike row reads No bike yet and goes to Connect Bike (L2-112 AC2)', async ({
  page,
}) => {
  const profile = new ProfilePage(page);
  await profile.open();

  await expect(profile.bikeRow).toHaveAccessibleName('No bike yet Pair your bike');
  await profile.bikeRow.click();
  await expect(page).toHaveURL('/connect');
  await expect(new ConnectBikePage(page).title).toBeVisible();
});

// Acceptance test
// Traces to: L2-158 AC1, AC2, AC3, AC5, AC6, AC7, L2-164 AC5, L2-112 AC1
// Description: Settings at /settings opens from Profile's Ride settings row, with Profile current in the header, its
// heading and lead, five section landmarks and the "Settings sections" nav. A change applies at once and is kept on
// this device with no Save; a malformed stored setting reads as its recommended value; Reset to recommended puts
// every setting back; when the browser refuses storage a warning says so and the controls still work. The first
// control is Keep the screen awake, which a class ride follows. The other sections' controls are built by slices
// 20.2 to 20.5.
import { startClassRide } from './fixtures/class-ride';
import { echelonBike } from './fixtures/echelon';
import { refuseStorage, storeSettings, storedSettings } from './fixtures/settings-storage';
import { expect, test } from './fixtures/test';
import { ProfilePage } from './pages/profile.page';
import { SettingsPage } from './pages/settings.page';

const SECTIONS = ['World', 'Sound', 'Motion and display', 'Bike', 'This device'];

test('Settings opens from Profile with Profile current, its five sections and their nav (L2-158 AC1, AC2) @critical', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike);
  const profile = new ProfilePage(page);
  await profile.open();
  await profile.rideSettings.click();

  const settings = new SettingsPage(page);
  await expect(page).toHaveURL('/settings');
  await expect(page).toHaveTitle('Settings · Telo Ride');
  await expect(settings.header.current()).toHaveText('Profile');
  await expect(settings.heading).toHaveText('Settings');
  await expect(settings.lead).toHaveText(
    'How Telo Ride looks, sounds and moves on this device. Changes apply at once, even mid-ride, and stay on this device.',
  );
  await expect(settings.sections).toHaveCount(5);
  for (const [index, name] of SECTIONS.entries()) {
    await expect(settings.sections.nth(index)).toHaveAccessibleName(name);
    await expect(settings.sectionNav.getByRole('link').nth(index)).toHaveText(name);
  }
  await expect(settings.bikeRow).toHaveAccessibleName('Echelon EX-5s Not connected · diagnostics');
  await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0);

  // The nav goes to its section on this page.
  await settings.navLink('This device').click();
  await expect(page).toHaveURL('/settings#device');
  await expect(settings.section('This device')).toBeInViewport();

  await settings.back.click();
  await expect(page).toHaveURL('/profile');
});

test('Settings opened at a section shows that section (L2-158 AC2)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  const settings = new SettingsPage(page);
  await settings.open('bike');

  await expect(settings.section('Bike')).toBeInViewport();
  await expect(settings.section('World')).not.toBeInViewport();
});

test('a change applies at once and is kept on this device, with no Save (L2-158 AC3)', async ({
  page,
}) => {
  const settings = new SettingsPage(page);
  await settings.open();
  await expect(settings.keepAwake).toHaveAttribute('aria-checked', 'true');

  await settings.keepAwake.click();
  await expect(settings.keepAwake).toHaveAttribute('aria-checked', 'false');
  expect(await storedSettings(page)).toEqual({ keepAwake: false });

  await page.reload();
  await expect(settings.keepAwake).toHaveAttribute('aria-checked', 'false');

  // By keyboard too.
  await settings.keepAwake.focus();
  await page.keyboard.press('Space');
  await expect(settings.keepAwake).toHaveAttribute('aria-checked', 'true');
  expect(await storedSettings(page)).toEqual({ keepAwake: true });
});

test('a malformed stored setting reads as its recommended value (L2-158 AC5)', async ({ page }) => {
  await storeSettings(page, JSON.stringify({ keepAwake: 'no', theme: 7 }));
  const settings = new SettingsPage(page);
  await settings.open();
  await expect(settings.keepAwake).toHaveAttribute('aria-checked', 'true');

  await storeSettings(page, '{not json');
  await page.reload();
  await expect(settings.keepAwake).toHaveAttribute('aria-checked', 'true');
});

test('Reset to recommended puts every setting back as it started (L2-158 AC6)', async ({
  page,
}) => {
  await storeSettings(page, JSON.stringify({ keepAwake: false }));
  const settings = new SettingsPage(page);
  await settings.open();
  await expect(settings.keepAwake).toHaveAttribute('aria-checked', 'false');
  await expect(settings.resetText).toHaveText(
    'Put every setting on this page back as it started. Your rides and progress stay.',
  );

  await settings.reset.click();
  await expect(settings.keepAwake).toHaveAttribute('aria-checked', 'true');
  expect(await storedSettings(page)).toEqual({ keepAwake: true });
  await expect(settings.announcement).toHaveText('Settings reset');
});

test('when the browser refuses storage, a warning says so and the controls still work (L2-158 AC7)', async ({
  page,
}) => {
  await refuseStorage(page);
  const settings = new SettingsPage(page);
  await settings.open();

  await expect(settings.notStored).toHaveText(
    'This browser isn’t keeping your settings. Changes work until you close this tab. Private windows and blocked site data do this; open Telo Ride in a normal window to keep them.',
  );
  await settings.keepAwake.click();
  await expect(settings.keepAwake).toHaveAttribute('aria-checked', 'false');
});

test('with Keep the screen awake off, a class ride lets the screen sleep (L2-164 AC5)', async ({
  page,
  bluetooth,
  api,
  wakeLock,
}) => {
  await storeSettings(page, JSON.stringify({ keepAwake: false }));
  await startClassRide(page, bluetooth, api);
  await page.clock.runFor(5_000);

  expect(await wakeLock.locks()).toEqual([]);
});

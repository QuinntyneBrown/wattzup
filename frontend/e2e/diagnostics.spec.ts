import { RIDE_START } from './fixtures/class-ride';
import { startCustomRide } from './fixtures/custom-ride';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { AppDocument } from './pages/app-document';
import { CustomRidePage } from './pages/custom-ride.page';
import { DiagnosticsDialog } from './pages/diagnostics.dialog';
import { ProfilePage } from './pages/profile.page';

// Slice 25.1, Inspect diagnostics (L2-113): the browser, Web Bluetooth, the bike link and the app in one dialog, read in
// the browser and kept on the device.
//
// Given a paired bike, when the rider opens Diagnostics from Profile, then a modal dialog labelled "Diagnostics" shows
//   the privacy note, the app behind it is inert, and Escape or "Close diagnostics" gives the focus back to the row
//   (AC1, AC5).
// Given a connected bike on the custom ride, when its bike status opens Diagnostics, then the facts read Browser, Web
//   Bluetooth "Available", Page, Bike "Echelon EX-5s · 0bf669f1", Connection "Connected · …", Last command "RES 8 ·
//   plan · ack … ms", Reconnects "0 this ride", Rides waiting to send "0" and App version; this browser reports no
//   signal strength, so Signal is absent (AC2).
// Given no bike picked, when Diagnostics opens, then Bike reads "None picked yet" and the link facts are absent (AC3).
// Given Bluetooth off, when Diagnostics opens, then Web Bluetooth reads "Supported · adapter off" and Bike "Echelon
//   EX-5s · last seen 2 days ago" (AC4).

const PRIVACY =
  'Everything here is read in your browser and stays on this device until you download it.';

test('Diagnostics opens from Profile as a modal dialog and gives the focus back as it closes (L2-113 AC1, AC5) @critical', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike);
  const profile = new ProfilePage(page);
  await profile.open();
  const diagnostics = new DiagnosticsDialog(page);

  await profile.bikeRow.click();
  await expect(diagnostics.heading).toBeVisible();
  await expect(diagnostics.privacy).toHaveText(PRIVACY);
  await expect(new AppDocument(page).app).toHaveAttribute('inert');

  await page.keyboard.press('Escape');
  await expect(diagnostics.root).toHaveCount(0);
  await expect(profile.bikeRow).toBeFocused();

  await profile.bikeRow.click();
  await diagnostics.close.click();
  await expect(diagnostics.root).toHaveCount(0);
  await expect(profile.bikeRow).toBeFocused();
});

test('a connected bike’s facts, from the custom ride’s bike status (L2-113 AC1, AC2)', async ({
  page,
  bluetooth,
}) => {
  const ride = await startCustomRide(page, bluetooth);
  // The dialog's code loads on demand and a zoneless app renders on a timer: let time run, as it does for a rider.
  await page.clock.resume();
  await ride.diagnostics.click();
  const diagnostics = new DiagnosticsDialog(page);

  await expect(diagnostics.terms).toHaveText([
    'Browser',
    'Web Bluetooth',
    'Page',
    'Bike',
    'Connection',
    'Last command',
    'Reconnects',
    'Rides waiting to send',
    'App version',
  ]);
  await expect(diagnostics.fact('Browser')).toHaveText(/^[A-Za-z ]+ \d+ · \S.*$/);
  await expect(diagnostics.fact('Web Bluetooth')).toHaveText('Available');
  await expect(diagnostics.fact('Page')).toHaveText(page.url());
  await expect(diagnostics.fact('Bike')).toHaveText('Echelon EX-5s · 0bf669f1');
  await expect(diagnostics.fact('Connection')).toHaveText(/^Connected · \d+m \d\ds$/);
  await expect(diagnostics.fact('Last command')).toHaveText(/^RES 8 · plan · ack \d+ ms$/);
  await expect(diagnostics.fact('Reconnects')).toHaveText('0 this ride');
  await expect(diagnostics.fact('Rides waiting to send')).toHaveText('0');
  await expect(diagnostics.fact('App version')).toHaveText(/^\d+\.\d+\.\d+ · client \S+$/);
  await expect(diagnostics.privacy).toHaveText(PRIVACY);

  await page.keyboard.press('Escape');
  await expect(diagnostics.root).toHaveCount(0);
  await expect(ride.diagnostics).toBeFocused();
});

test('with no bike picked, Bike reads "None picked yet" and the link facts are absent (L2-113 AC3)', async ({
  page,
}) => {
  await page.clock.install({ time: RIDE_START });
  const ride = new CustomRidePage(page);
  await ride.open();
  await ride.diagnostics.click();
  const diagnostics = new DiagnosticsDialog(page);

  await expect(diagnostics.terms).toHaveText([
    'Browser',
    'Web Bluetooth',
    'Page',
    'Bike',
    'Rides waiting to send',
    'App version',
  ]);
  await expect(diagnostics.fact('Bike')).toHaveText('None picked yet');
});

test('with Bluetooth off, the adapter and the bike last seen (L2-113 AC4)', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike, { lastSeenDaysAgo: 2 });
  await bluetooth.adapterOff();
  const profile = new ProfilePage(page);
  await profile.open();
  await profile.bikeRow.click();
  const diagnostics = new DiagnosticsDialog(page);

  await expect(diagnostics.fact('Web Bluetooth')).toHaveText('Supported · adapter off');
  await expect(diagnostics.fact('Bike')).toHaveText('Echelon EX-5s · last seen 2 days ago');
  await expect(diagnostics.terms).toHaveText([
    'Browser',
    'Web Bluetooth',
    'Page',
    'Bike',
    'Rides waiting to send',
    'App version',
  ]);
});

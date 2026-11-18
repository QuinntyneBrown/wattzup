import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { NOW, freeRide, state, workout } from './fixtures/states';

test.describe('Connection banners (L2-054)', () => {
  test('a dropped stream warns with the time of the last state and Retry now', async ({
    page,
    api,
    events,
  }) => {
    await page.clock.install({ time: NOW });
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await events.fail();
    const banner = ride.banner('Lost connection to the Wattzup server');
    await expect(ride.bannerText(banner)).toHaveText(
      'Retrying every 2 seconds. Numbers below are from 7:10 PM and controls are paused.',
    );
    await expect(banner).toHaveClass(/alert--warning/);
    await expect(banner).toHaveAttribute('role', 'alert');
    await expect(ride.raiseButton).toBeDisabled();
    await expect(ride.readouts).toHaveClass(/readouts--dimmed/);
    await ride.button(banner, 'Retry now').click();
    await expect.poll(async () => (await events.connections()).length).toBe(2);
    await ride.push(state());
    await expect(banner).toHaveCount(0);
    await expect(ride.raiseButton).toBeEnabled();
  });

  test('Bluetooth off shows a danger banner with Open diagnostics', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ adapter: 'off', ble: 'error' }));
    const banner = ride.banner('Bluetooth is off');
    await expect(ride.bannerText(banner)).toHaveText(
      'Turn Bluetooth on to reach the bike. Wattzup retries every 3 seconds.',
    );
    await expect(banner).toHaveClass(/alert--danger/);
    await expect(ride.button(banner, 'Open diagnostics')).toBeVisible();
    await ride.push(state());
    await expect(banner).toHaveCount(0);
  });

  test('a simulated bike shows an info banner dismissed for the session', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ simulated: true }));
    const banner = ride.banner('Simulated bike');
    await expect(ride.bannerText(banner)).toHaveText(
      'No hardware connected — Wattzup started with --simulate and is generating cadence and resistance.',
    );
    await ride.button(banner, 'Dismiss').click();
    await expect(banner).toHaveCount(0);
    await page.reload();
    await ride.push(state({ simulated: true }));
    await expect(ride.statusState).toHaveText('Connected');
    await expect(banner).toHaveCount(0);
  });

  test('a bike that comes back mid-workout shows Reconnected for 4 s', async ({
    page,
    api,
    events,
  }) => {
    await page.clock.install({ time: NOW });
    const ride = new RidePage(page, api, events);
    await ride.open(
      state({ ble: 'disconnected', workout: workout({ status: 'paused: bike disconnected' }) }),
    );
    await ride.push(state({ workout: workout({ elapsed_seconds: 432 }) }));
    const banner = ride.banner('Reconnected');
    await expect(ride.bannerText(banner)).toHaveText(
      'Echelon EX-5s is back. The plan picked up at 7:12 and resistance is set to 18.',
    );
    await expect(banner).toHaveClass(/alert--success/);
    await page.clock.runFor(4100);
    await expect(banner).toHaveCount(0);
  });

  test('a server shared on the network says so once per session', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ exposed: true, bind_address: '192.168.1.20:8787' }));
    const banner = ride.banner('Shared on your network');
    await expect(ride.bannerText(banner)).toHaveText(
      "This server listens on 192.168.1.20:8787. Anyone with the API key can change the bike's resistance.",
    );
    await ride.button(banner, 'Dismiss').click();
    await expect(banner).toHaveCount(0);
    await page.reload();
    await ride.push(state({ exposed: true }));
    await expect(ride.statusState).toHaveText('Connected');
    await expect(banner).toHaveCount(0);
  });
});

test.describe('Ride dashboard overlays and errors (L2-058)', () => {
  test('scanning shows Looking for your bike with the waiting ride', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ ble: 'scanning', workout: workout({ status: 'waiting for bike' }) }));
    await expect(ride.overlayTitle).toHaveText('Looking for your bike');
    await expect(ride.overlayText).toHaveText([
      'No Echelon bike found yet — pedal to wake it up. Wattzup scans again every 20 seconds.',
      'Your ride starts as soon as the bike connects: HIIT · 8 × 40s / 20s.',
    ]);
    await ride.push(freeRide({ ble: 'scanning' }));
    await expect(ride.overlayText).toHaveCount(1);
  });

  test('Bluetooth off shows the adapter overlay', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ adapter: 'off', ble: 'error' }));
    await expect(ride.overlayTitle).toHaveText('Bluetooth is off');
    await expect(ride.overlayText).toHaveText(
      "Wattzup can't reach this computer's Bluetooth adapter. Turn Bluetooth on — Wattzup retries every 3 seconds and connects on its own.",
    );
    await expect(ride.button(ride.overlay, 'Open diagnostics')).toBeVisible();
  });

  test('a lost bike dims the readouts and offers Reconnect', async ({ page, api, events }) => {
    api.on('POST', '/api/bike/reconnect', { status: 202, json: {} });
    const ride = new RidePage(page, api, events);
    await ride.open(
      state({ ble: 'disconnected', workout: workout({ status: 'paused: bike disconnected' }) }),
    );
    await expect(ride.overlayTitle).toHaveText('Lost the bike');
    await expect(ride.overlayText).toHaveText([
      'Echelon EX-5s stopped answering. Wake it with a pedal stroke, then reconnect — your ride is saved at 7:07.',
      'The plan is paused. If the bike stays off for 90 seconds, Wattzup ends the ride.',
    ]);
    await expect(ride.readouts).toHaveClass(/readouts--dimmed/);
    await expect(ride.endButton).toBeEnabled();
    await ride.button(ride.overlay, 'Reconnect').click();
    await api.waitForCall('POST', '/api/bike/reconnect');
  });

  test('a bike that shut off ends the ride with Ride another class and Build your own ride', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(
      state({
        ble: 'disconnected',
        workout: workout({ status: 'ended: bike shut off', elapsed_seconds: 582 }),
      }),
    );
    await expect(ride.overlayTitle).toHaveText('Ride ended — the bike shut off');
    await expect(ride.overlayText).toHaveText(
      'Echelon EX-5s was off for more than 90 seconds, so Wattzup ended the workout at 9:42. Your numbers are kept below.',
    );
    await expect(ride.link(ride.overlay, 'Ride another class')).toHaveAttribute('href', '/classes');
    await expect(ride.link(ride.overlay, 'Build your own ride')).toHaveAttribute('href', '/setup');
  });

  test('a failed GET /api/status reads Couldn’t load your ride and Try again reloads', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    api.on('GET', '/api/status', { status: 500, json: { title: 'error', status: 500 } });
    await page.goto('/');
    await expect(ride.loadErrorTitle).toHaveText("Couldn't load your ride");
    await expect(ride.loadErrorText).toHaveText(
      'The Wattzup server answered GET /api/status with an error (500). Your bike connection and any running workout are not affected.',
    );
    await expect(ride.button(ride.loadError, 'Open diagnostics')).toBeVisible();
    await expect(ride.raiseButton).toBeDisabled();
    await expect(ride.planNote).toHaveText('Controls return when Wattzup can read the bike again.');
    api.on('GET', '/api/status', { json: state() });
    await ride.tryAgainButton.click();
    await expect(ride.loadError).toHaveCount(0);
    await expect(ride.powerValue).toHaveText('317');
  });
});

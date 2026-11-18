// The machine page at /machine: pick the bike or the Stride, which connects at once (L2-073).
import classes from './fixtures/recorded/classes.json';
import machineBike from './fixtures/recorded/machine-bike.json';
import machineTreadmill from './fixtures/recorded/machine-treadmill.json';
import workoutActive from './fixtures/recorded/problem-machine-workout-active.json';
import { expect, test } from './fixtures/wz-test';
import {
  freeRide,
  machinePageState,
  nearbyEntry,
  state,
  treadmillIdle,
  treadmillState,
} from './fixtures/states';
import workoutStopped from './fixtures/recorded/workout-stopped.json';
import { EndRideDialog } from './pages/end-ride.dialog';
import { MachinePage, session } from './pages/machine.page';
import { RidePage } from './pages/ride.page';
import { SetupPage } from './pages/setup.page';

const NOT_FOUND = 'No Echelon treadmill found yet — switch it on to wake it up';

test.describe('Machine page (L2-073)', () => {
  test('shows the title, the lead and both cards as one radio group moved by arrow keys', async ({
    page,
    api,
    events,
  }) => {
    const machine = new MachinePage(page, api, events);
    api.on('POST', '/api/machine', { json: machineTreadmill });
    await machine.open();
    await expect(page).toHaveTitle('Choose machine · Wattzup');
    await expect(machine.heading).toHaveText('What are you training on?');
    await expect(machine.lead).toHaveText(
      'Wattzup drives one machine at a time. Pick one — the other stays disconnected until you switch.',
    );
    await expect(machine.group.getByRole('radio')).toHaveCount(2);

    await machine.bike.radio.focus();
    await page.keyboard.press('ArrowRight');
    await expect(machine.treadmill.radio).toBeChecked();
    const [call] = await api.waitForCall('POST', '/api/machine');
    expect(call?.body).toEqual({ machine: 'treadmill' });
  });

  test("shows each card's kind, signal, name, advertised name, controls and last session", async ({
    page,
    api,
    events,
  }) => {
    const machine = new MachinePage(page, api, events);
    await machine.open(machinePageState(), {
      lastUsed: 'bike',
      sessions: {
        bike: session('bike', 'HIIT 8 × 40s', 1),
        treadmill: session('treadmill', 'Hill walk 30 min', 4),
      },
    });
    await expect(machine.bike.kind).toHaveText('Bike');
    await expect(machine.bike.signal).toHaveAttribute('aria-label', 'Signal 3 of 4');
    await expect(machine.bike.name).toHaveText('Echelon EX-5s');
    await expect(machine.bike.serial).toHaveText('ECHEX-3-141844');
    await expect(machine.bike.controls).toHaveText('Resistance, levels 1–32');
    await expect(machine.bike.lastSession).toHaveText('HIIT 8 × 40s · yesterday');
    await expect(machine.bike.cta).toHaveText('Ride the bike');
    await expect(machine.treadmill.kind).toHaveText('Treadmill');
    await expect(machine.treadmill.signal).toHaveAttribute('aria-label', 'Signal 4 of 4');
    await expect(machine.treadmill.name).toHaveText('Echelon Stride');
    await expect(machine.treadmill.serial).toHaveText('STRIDE-8s22-000766');
    await expect(machine.treadmill.controls).toHaveText('Speed 0.8–19.3 km/h, incline 0–10%');
    await expect(machine.treadmill.lastSession).toHaveText('Hill walk 30 min · 4 days ago');
    await expect(machine.treadmill.cta).toHaveText('Run on the Stride');
  });

  test('shows defaults for a machine not heard and with no session', async ({
    page,
    api,
    events,
  }) => {
    const machine = new MachinePage(page, api, events);
    await machine.open(machinePageState({ nearby: [nearbyEntry('bike')] }));
    await expect(machine.treadmill.name).toHaveText('Echelon Stride');
    await expect(machine.treadmill.serial).toHaveText('Not heard yet');
    await expect(machine.treadmill.signal).toHaveAttribute('aria-label', 'Signal 0 of 4');
    await expect(machine.treadmill.lastSession).toHaveText('None yet');
    await expect(machine.bike.tag).toHaveCount(0);
    await expect(machine.treadmill.tag).toHaveCount(0);
  });

  test('marks the last used machine with a tag and a volt call to action', async ({
    page,
    api,
    events,
  }) => {
    const machine = new MachinePage(page, api, events);
    await machine.open(machinePageState(), {
      lastUsed: 'treadmill',
      sessions: { treadmill: session('treadmill', 'Minute on', 0) },
    });
    await expect(machine.treadmill.tag).toHaveText('Last used');
    await expect(machine.treadmill.cta).toHaveClass(/machine-card__cta--primary/);
    await expect(machine.treadmill.lastSession).toHaveText('Minute on · today');
    await expect(machine.bike.tag).toHaveCount(0);
    await expect(machine.bike.cta).not.toHaveClass(/machine-card__cta--primary/);
  });

  test('reads the nearby count, No machines nearby, or Looking for machines', async ({
    page,
    api,
    events,
  }) => {
    const machine = new MachinePage(page, api, events);
    await machine.open(null);
    await expect(machine.nearby).toHaveText('Looking for machines…');
    await machine.open(machinePageState());
    await expect(machine.nearby).toHaveText('2 machines nearby');
    await events.push(machinePageState({ nearby: [] }));
    await expect(machine.nearby).toHaveText('No machines nearby');
  });

  test('shows the no-machines notice and keeps both cards pickable', async ({
    page,
    api,
    events,
  }) => {
    const machine = new MachinePage(page, api, events);
    await machine.open(machinePageState({ nearby: [] }));
    await expect(machine.notice).toContainText(
      "Switch the bike's console on, or switch on the Stride and clip in its safety key. Wattzup keeps looking.",
    );
    await expect(machine.bike.radio).toBeEnabled();
    await expect(machine.treadmill.radio).toBeEnabled();
  });

  test('picking the connected bike opens the class library (L2-073 AC6, L2-079)', async ({
    page,
    api,
    events,
  }) => {
    const machine = new MachinePage(page, api, events);
    api.on('POST', '/api/machine', { json: machineBike });
    api.on('GET', '/api/classes', { json: classes });
    await machine.open();
    await machine.bike.root.click();
    const [call] = await api.waitForCall('POST', '/api/machine');
    expect(call?.body).toEqual({ machine: 'bike' });
    await expect(page).toHaveURL(/\/classes$/);
  });

  test('connects on pick, disables both cards, and opens setup once the treadmill is connected', async ({
    page,
    api,
    events,
  }) => {
    const machine = new MachinePage(page, api, events);
    api.on('POST', '/api/machine', { json: machineTreadmill });
    await machine.open();
    await machine.treadmill.root.click();
    const [call] = await api.waitForCall('POST', '/api/machine');
    expect(call?.body).toEqual({ machine: 'treadmill' });
    await expect(machine.treadmill.cta).toHaveText('Connecting to treadmill…');
    await expect(machine.group).toHaveAttribute('aria-busy', 'true');
    await expect(machine.bike.radio).toBeDisabled();
    await expect(machine.treadmill.radio).toBeDisabled();

    await events.push(
      machinePageState({ machine: 'treadmill', ble: 'scanning', device: null, device_label: null }),
    );
    await expect(page).toHaveURL(/\/machine$/);
    await events.push(treadmillIdle({ nearby: [nearbyEntry('bike'), nearbyEntry('treadmill')] }));
    await expect(page).toHaveURL(/\/setup$/);
  });

  test('shows the not-found card with Try again after the scan error', async ({
    page,
    api,
    events,
  }) => {
    const machine = new MachinePage(page, api, events);
    api.on('POST', '/api/machine', { json: machineTreadmill });
    await machine.open();
    await machine.treadmill.root.click();
    await api.waitForCall('POST', '/api/machine');
    await events.push(
      machinePageState({ machine: 'treadmill', ble: 'scanning', device: null, error: NOT_FOUND }),
    );
    await events.push(
      machinePageState({ machine: 'treadmill', ble: 'scanning', device: null, error: null }),
    );
    await expect(machine.treadmill.root).toHaveClass(/machine-card--failed/);
    await expect(machine.treadmill.radio).toHaveAttribute('aria-invalid', 'true');
    await expect(machine.treadmill.error).toHaveText(
      'The Stride isn’t answering. Check it’s switched on and the safety key is clipped in.',
    );

    await machine.treadmill.tryAgainButton.click();
    await expect.poll(() => api.calls('POST', '/api/machine').length).toBe(2);
    await expect(machine.treadmill.error).toHaveCount(0);
    await expect(machine.treadmill.cta).toHaveText('Connecting to treadmill…');
  });

  test('shows an alert when the switch fails or a run is in progress', async ({
    page,
    api,
    events,
  }) => {
    const machine = new MachinePage(page, api, events);
    api.on('POST', '/api/machine', { abort: true });
    await machine.open();
    await machine.treadmill.root.click();
    await expect(machine.alert).toContainText("The Wattzup server didn't answer. Try again.");
    await expect(machine.treadmill.radio).toBeEnabled();
    await expect(machine.treadmill.radio).not.toBeChecked();

    api.on('POST', '/api/machine', { status: 409, json: workoutActive });
    await machine.treadmill.root.click();
    await expect(machine.alert).toContainText('End the run in progress to change the machine.');
  });

  test('ends the workout through the end dialog before opening the machine page', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout/stop', { json: workoutStopped });
    const ride = new RidePage(page, api, events);
    const end = new EndRideDialog(page);
    await ride.open(state({ treadmill_enabled: true }));
    await expect(ride.switchLink).toHaveText('End and switch to treadmill');
    await ride.switchLink.click();
    await expect(end.dialog).toBeVisible();
    await end.endRideButton.click();
    await api.waitForCall('POST', '/api/workout/stop');
    await expect(page).toHaveURL(/\/machine$/);
  });

  test('opens the machine page at once from a dashboard with no workout', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState());
    await expect(ride.switchLink).toHaveText('End and switch to bike');
    await ride.open(freeRide({ treadmill_enabled: true }));
    await ride.switchLink.click();
    await expect(page).toHaveURL(/\/machine$/);
    expect(api.calls('POST', '/api/workout/stop')).toHaveLength(0);
  });

  test('stacks the cards under 768 px', async ({ page, api, events }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    const machine = new MachinePage(page, api, events);
    await machine.open();
    const bike = await machine.bike.root.boundingBox();
    const treadmill = await machine.treadmill.root.boundingBox();
    expect(treadmill!.y).toBeGreaterThanOrEqual(bike!.y + bike!.height);
    expect(bike!.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Treadmill support off (L2-073 AC11, L2-075 AC6)', () => {
  test('/machine opens the setup screen', async ({ page, api, events }) => {
    const machine = new MachinePage(page, api, events);
    await machine.open(freeRide());
    await expect(page).toHaveURL(/\/setup$/);
  });

  test('shows no Switch link on the setup screen or the dashboard', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(freeRide());
    await expect(setup.heading).toHaveText('Set up your ride');
    await expect(setup.switchLink).toHaveCount(0);
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.switchLink).toHaveCount(0);
    await ride.open(freeRide());
    await expect(ride.switchLink).toHaveCount(0);
  });
});

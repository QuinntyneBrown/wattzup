import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { ToastRegion } from './pages/toast-region';
import { EndRideDialog } from './pages/end-ride.dialog';
import { ReplaceRideDialog } from './pages/replace-ride.dialog';
import { SetupPage } from './pages/setup.page';
import { FLAT_PLAN, treadmillIdle, treadmillState, treadmillWorkout } from './fixtures/states';
import treadmillPaused from './fixtures/recorded/treadmill-workout-paused.json';
import treadmillStopped from './fixtures/recorded/treadmill-workout-stopped.json';
import speedSent from './fixtures/recorded/speed-sent.json';
import inclineSent from './fixtures/recorded/incline-sent.json';

const notConnected = {
  status: 503,
  json: { title: 'Service Unavailable', status: 503, code: 'treadmill_not_connected' },
};

test.describe('Treadmill dashboard: readouts and controls (L2-071)', () => {
  test('shows the Stride in the status line and Stop belt in place of End', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    const end = new EndRideDialog(page, 'treadmill');
    await ride.open(treadmillState({ device_label: 'Echelon Stride' }));
    await expect(ride.statusName).toHaveText('Echelon Stride');
    await expect(ride.statusState).toHaveText('Connected');
    await expect(ride.workoutLink).toHaveText('HIIT · 18 × 40s / 20s');
    await expect(ride.rideClock).toHaveText('7:07 / 22:40');
    await expect(ride.endButton).toHaveCount(0);
    await expect(ride.stopBeltButton).toHaveClass(/btn--stop-belt/);
    await ride.stopBeltButton.click();
    await expect(end.description).toBeVisible();
    await end.keepRidingButton.click();

    await ride.push(treadmillState({ workout: treadmillWorkout({ status: 'starting belt' }) }));
    await expect(ride.pauseButton).toBeDisabled();
    await ride.push(treadmillState({ ble: 'disconnected' }));
    await expect(ride.pauseButton).toBeDisabled();
    await ride.push(treadmillState({ workout: treadmillWorkout({ status: 'paused' }) }));
    await expect(ride.resumeButton).toBeEnabled();
  });

  test('shows speed in km/h with pace, and no mph', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState({ speed_kmh: 13, speed_mph: 8.1, target_speed: 13 }));
    await expect(ride.speedValue).toHaveText('13.0');
    await expect(ride.speedUnit).toHaveText('km/h');
    await expect(ride.speedPace).toHaveText('4:37 /km');
    await expect(ride.speed).not.toContainText('mph');
    await ride.push(treadmillState({ speed_kmh: 0.4, target_speed: 0.4 }));
    await expect(ride.speedPace).toHaveText('–:–– /km');
  });

  test('words the speed status: starting, paused, stopped, ramping and at target', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState());
    await expect(ride.speedStatus).toHaveText('At target');
    await expect(ride.speedStatus).toHaveClass(/delta--on/);
    await ride.push(treadmillState({ speed_kmh: 7, target_speed: 9 }));
    await expect(ride.speedStatus).toHaveText('Ramping to 9.0');
    await expect(ride.speedStatus).toHaveClass(/delta--low/);
    await ride.push(treadmillState({ speed_kmh: 8.96, target_speed: 9 }));
    await expect(ride.speedStatus).toHaveText('At target');
    await ride.push(
      treadmillState({ speed_kmh: 0, workout: treadmillWorkout({ status: 'starting belt' }) }),
    );
    await expect(ride.speedStatus).toHaveText('Starting belt');
    await ride.push(
      treadmillState({ speed_kmh: 0, workout: treadmillWorkout({ status: 'paused' }) }),
    );
    await expect(ride.speedStatus).toHaveText('Belt paused');
    await ride.push(treadmillState({ speed_kmh: 0, belt: 'stopped' }));
    await expect(ride.speedStatus).toHaveText('Belt stopped');
  });

  test('shows the incline with its plan or Deck moving to', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState({ incline: 0, target_incline: 0 }));
    await expect(ride.inclineValue).toHaveText('0');
    await expect(ride.inclineUnit).toHaveText('%');
    await expect(ride.inclineSub).toHaveText(['Plan 0%']);
    await ride.push(treadmillState({ incline: 0, target_incline: 3 }));
    await expect(ride.inclineSub).toHaveText(['Deck moving to 3%']);
  });

  test('shows heart rate, avg pace, distance, climbed and energy', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState({ distance_km: 1.05, climb_m: 22, kcal: 1116 }));
    await expect(ride.metrics.locator('dt')).toHaveText([
      'Heart rate',
      'Avg pace',
      'Distance',
      'Climbed',
      'Energy',
    ]);
    await expect(ride.metric('Heart rate')).toHaveText('--bpm');
    await expect(ride.metric('Avg pace')).toHaveText('6:47/km');
    await expect(ride.metric('Distance')).toHaveText('1.05km');
    await expect(ride.metric('Climbed')).toHaveText('22m');
    await expect(ride.metric('Energy')).toHaveText('1,116kcal');
    await expect(ride.power).toHaveCount(0);
    await expect(ride.cadenceValue).toHaveCount(0);
    await ride.push(treadmillState({ distance_km: 0 }));
    await expect(ride.metric('Avg pace')).toHaveText('–:––/km');
  });

  test('shows the Speed and Incline sections in place of the resistance panel', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState());
    await expect(ride.aside).toHaveCount(0);
    await expect(ride.treadmillAsideTitle).toHaveText(['Speed', 'Incline']);
    await expect(ride.speedControlValue).toHaveText('9.0');
    await expect(ride.inclineControlValue).toHaveText('0%');
  });

  test('steps speed by 0.5 from the target and sends a quick speed', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/speed', { json: speedSent });
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState({ speed_kmh: 7, target_speed: 9 }));
    await expect(ride.speedControlValue).toHaveText('9.0');
    await expect(ride.speedControlNote).toHaveText('km/h target · 6:40 /km');
    await ride.raiseSpeedButton.click();
    await ride.lowerSpeedButton.click();
    await ride.quickSpeed('12').click();
    const speeds = await api.waitForCall('POST', '/api/speed', 3);
    expect(speeds.map((c) => c.body)).toEqual([{ speed: 9.5 }, { speed: 8.5 }, { speed: 12 }]);
    await expect(ride.quickSpeeds).toHaveText(['5', '8', '10', '12', '14', '16']);

    await ride.push(treadmillState({ target_speed: 10, speed_kmh: 10 }));
    await expect(ride.quickSpeed('10')).toHaveAttribute('aria-pressed', 'true');
    await expect(ride.quickSpeed('12')).toHaveAttribute('aria-pressed', 'false');

    await ride.push(treadmillState({ target_speed: null }));
    await ride.raiseSpeedButton.click();
    await expect.poll(() => api.calls('POST', '/api/speed').at(-1)?.body).toEqual({ speed: 9.5 });

    await ride.push(treadmillState({ speed_kmh: 19.3, target_speed: 19.3 }));
    await expect(ride.raiseSpeedButton).toBeDisabled();
    await expect(ride.lowerSpeedButton).toBeEnabled();
    await ride.push(treadmillState({ speed_kmh: 0.8, target_speed: 0.8 }));
    await expect(ride.lowerSpeedButton).toBeDisabled();
  });

  test('steps the incline by 1 and picks it from the bars', async ({ page, api, events }) => {
    api.on('POST', '/api/incline', { json: inclineSent });
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState({ incline: 1, target_incline: 2 }));
    await expect(ride.inclineControlValue).toHaveText('2%');
    await expect(ride.inclineControlNote).toHaveText('of 10%');
    await expect(ride.inclinePicker).toHaveAttribute('aria-valuenow', '2');
    await expect(ride.inclinePicker).toHaveAttribute('aria-valuetext', '2% of 10%');
    await expect(ride.inclinePickerBars).toHaveCount(11);
    await expect(ride.inclinePicker.locator('.is-lit')).toHaveCount(3);
    await ride.raiseInclineButton.click();
    await ride.lowerInclineButton.click();
    await ride.inclinePicker.press('ArrowRight');
    const inclines = await api.waitForCall('POST', '/api/incline', 3);
    expect(inclines.map((c) => c.body)).toEqual([{ incline: 3 }, { incline: 1 }, { incline: 3 }]);

    await ride.push(treadmillState({ incline: 0, target_incline: 0 }));
    await expect(ride.lowerInclineButton).toBeDisabled();
    await ride.push(treadmillState({ incline: 10, target_incline: 10 }));
    await expect(ride.raiseInclineButton).toBeDisabled();
  });

  test('disables speed and incline until the belt runs', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillIdle());
    for (const control of [
      ride.lowerSpeedButton,
      ride.raiseSpeedButton,
      ride.lowerInclineButton,
      ride.raiseInclineButton,
      ride.quickSpeed('8'),
    ]) {
      await expect(control).toBeDisabled();
    }
    await expect(ride.inclinePicker).toHaveAttribute('aria-disabled', 'true');
    await expect(ride.treadmillPlanNote).toHaveText(
      'Speed and incline controls wake up once the belt is running.',
    );
    await ride.push(
      treadmillState({ belt: 'stopped', workout: treadmillWorkout({ status: 'paused' }) }),
    );
    await expect(ride.raiseSpeedButton).toBeDisabled();
    await expect(ride.treadmillPlanNote).not.toContainText('wake up');
  });

  test('words the plan note and offers Back to plan in manual mode', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout/back-to-plan', { json: { workout: treadmillWorkout() } });
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState());
    await expect(ride.treadmillPlanNote).toHaveText(
      'Following the plan — speed and incline change with each interval.',
    );
    await ride.push(
      treadmillState({ target_speed: 11, workout: treadmillWorkout({ mode: 'manual' }) }),
    );
    await expect(ride.treadmillPlanNote).toContainText(
      'Manual speed. Plan takes over next interval.',
    );
    await ride.push(
      treadmillState({ target_incline: 3, workout: treadmillWorkout({ mode: 'manual' }) }),
    );
    await expect(ride.treadmillPlanNote).toContainText(
      'Manual incline. Plan takes over next interval.',
    );
    await ride.push(
      treadmillState({
        target_speed: 11,
        target_incline: 3,
        workout: treadmillWorkout({ mode: 'manual' }),
      }),
    );
    await expect(ride.treadmillPlanNote).toContainText(
      'Manual speed and incline. Plan takes over next interval.',
    );
    await ride.treadmillBackToPlan.click();
    await api.waitForCall('POST', '/api/workout/back-to-plan');
  });

  test('disables the controls with a note until the treadmill connects', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(
      treadmillIdle({ ble: 'scanning', device: null, device_label: null, belt: null }),
    );
    for (const button of [
      ride.lowerSpeedButton,
      ride.raiseSpeedButton,
      ride.lowerInclineButton,
      ride.raiseInclineButton,
    ]) {
      await expect(button).toBeDisabled();
    }
    await expect(ride.treadmillPlanNote).toHaveText(
      'Speed and incline controls wake up once the treadmill connects.',
    );
  });

  test('shows a danger toast when a speed or incline send answers 503', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/speed', notConnected);
    api.on('POST', '/api/incline', notConnected);
    const ride = new RidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await ride.open(treadmillState());
    await ride.raiseSpeedButton.click();
    const speedToast = toasts.toast("Couldn't set speed");
    await expect(toasts.text(speedToast)).toHaveText(
      "The treadmill isn't connected. Switch it on, then try again.",
    );
    await expect(speedToast).toHaveClass(/toast--danger/);
    await ride.raiseInclineButton.click();
    await expect(toasts.text(toasts.toast("Couldn't set incline"))).toHaveText(
      "The treadmill isn't connected. Switch it on, then try again.",
    );
  });
});

test.describe('Treadmill dashboard: belt and connection (L2-066, L2-071)', () => {
  const countdown = (n: number | null) =>
    treadmillState({
      speed_kmh: 0,
      speed_mph: 0,
      belt: 'starting',
      belt_countdown: n,
      workout: treadmillWorkout({
        status: 'starting belt',
        segment: 0,
        remaining: 180,
        elapsed_seconds: 0,
      }),
    });

  test('counts down the belt start and announces each number once', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(countdown(3));
    await expect(ride.overlayCount).toHaveText('3');
    await expect(ride.overlayCount).toHaveAttribute('aria-hidden', 'true');
    await expect(ride.overlayTitle).toHaveText('Belt starting in 3');
    await expect(ride.overlayTitle).toHaveAttribute('aria-live', 'polite');
    await expect(ride.overlayText).toHaveText(
      'Stand on the side rails. The belt starts when the count reaches zero.',
    );
    await expect(ride.badge).toHaveText('Starting belt');
    await expect(ride.badge).toHaveClass(/badge--info/);
    await ride.push(countdown(2));
    await expect(ride.overlayTitle).toHaveText('Belt starting in 2');
    await ride.push(countdown(1));
    await expect(ride.overlayTitle).toHaveText('Belt starting in 1');
    await ride.push(countdown(null));
    await expect(ride.overlayTitle).toHaveText('Starting the belt…');
    await expect(ride.overlayCount).toHaveCount(0);
    await ride.push(treadmillState());
    await expect(ride.overlay).toHaveCount(0);
  });

  test('shows Belt stopped with Resume enabled', async ({ page, api, events }) => {
    api.on('POST', '/api/workout/resume', { json: treadmillPaused });
    const ride = new RidePage(page, api, events);
    await ride.open(
      treadmillState({
        speed_kmh: 0,
        speed_mph: 0,
        belt: 'stopped',
        workout: treadmillWorkout({ status: 'paused: belt stopped' }),
      }),
    );
    await expect(ride.overlayTitle).toHaveText('Belt stopped');
    await expect(ride.overlayText).toHaveText(
      'The belt stopped, so Wattzup paused the run at 7:07. If you pulled the safety key, clip it back in, then press Resume — the belt starts after a 3-second countdown.',
    );
    await expect(ride.overlay).toHaveAttribute('role', 'alert');
    await expect(ride.overlayIcon).toHaveAttribute('data-icon', 'key');
    await expect(ride.badge).toHaveText('Belt stopped');
    await expect(ride.resumeButton).toBeEnabled();
    await ride.overlayResumeButton.click();
    await api.waitForCall('POST', '/api/workout/resume');
  });

  test('reads Lost the Stride in the overlay and the banner', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(
      treadmillState({
        ble: 'disconnected',
        belt: null,
        workout: treadmillWorkout({ status: 'paused: bike disconnected' }),
      }),
    );
    await expect(ride.overlayTitle).toHaveText('Lost the Stride');
    await expect(ride.overlayText).toHaveText([
      'The Stride stopped answering and stopped its belt. Step onto the side rails, then reconnect — your run is saved at 7:07.',
    ]);
    await expect(ride.overlayReconnectButton).toBeVisible();
    const banner = ride.banner('Lost the Stride');
    await expect(ride.bannerText(banner)).toHaveText(
      'Step onto the side rails. If the Stride stays off for 90 seconds, Wattzup ends the run.',
    );
    await expect(banner).toHaveClass(/alert--danger/);
    await expect(ride.bannerDismiss(banner)).toHaveCount(0);
    await expect(ride.badge).toHaveText('Treadmill disconnected');
    await expect(ride.badge).toHaveClass(/badge--danger/);
  });

  test('words the status line, scanning overlay, badges and simulated banner for the treadmill', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(
      treadmillIdle({
        ble: 'scanning',
        device: null,
        device_label: null,
        belt: null,
        workout: treadmillWorkout({ status: 'waiting for bike', segment: 0, elapsed_seconds: 0 }),
      }),
    );
    await expect(ride.statusName).toHaveText('Echelon treadmill');
    await expect(ride.statusState).toHaveText('Scanning…');
    await expect(ride.overlayTitle).toHaveText('Looking for your Stride');
    await expect(ride.overlayText).toHaveText([
      'No Echelon treadmill found yet — switch it on and clip in the safety key. Wattzup scans again every 20 seconds.',
      'Your run starts as soon as the Stride connects: HIIT · 18 × 40s / 20s.',
    ]);
    await expect(ride.badge).toHaveText('Waiting for treadmill');

    await ride.push(
      treadmillState({ workout: treadmillWorkout({ status: 'ended: bike shut off' }) }),
    );
    await expect(ride.badge).toHaveText('Treadmill shut off');

    await ride.push(treadmillState({ simulated: true }));
    const banner = ride.banner('Simulated treadmill');
    await expect(ride.bannerText(banner)).toHaveText(
      'No hardware connected — Wattzup started with --simulate and is generating speed and incline.',
    );
  });
});

test.describe('Treadmill dashboard: dialogs, phase and log (L2-071)', () => {
  test('ending the run returns to setup, not the class library (L2-051 AC2)', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout/stop', { json: treadmillStopped });
    const ride = new RidePage(page, api, events);
    const end = new EndRideDialog(page, 'treadmill');
    await ride.open(treadmillState());
    await ride.stopBeltButton.click();
    await end.endRideButton.click();
    await expect(page).toHaveURL(/\/setup$/);
  });

  test('words the end and replace dialogs for the run (AC15)', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    const end = new EndRideDialog(page, 'treadmill');
    await ride.open(treadmillState());
    await ride.stopBeltButton.click();
    await expect(end.description).toHaveText(
      "You're 7:07 into 22:40. Wattzup stops the belt; your trace and totals stay on the dashboard until you start a new run.",
    );
    await expect(end.note).toHaveCount(0);
    await expect(end.endRideButton).toBeVisible();
    await expect(end.keepRidingButton).toBeFocused();
    await end.keepRidingButton.click();

    const setup = new SetupPage(page, api, events);
    const replace = new ReplaceRideDialog(page, 'treadmill');
    await setup.open(treadmillState());
    await setup.steadyCard.check();
    await setup.startButton.click();
    await expect(replace.description).toHaveText(
      "You're 7:07 into HIIT · 18 × 40s / 20s. Starting Steady · 6.5 km/h at 8% · 30 min ends it and begins the new run at 0:00. Wattzup stops the belt first, then counts down 3 seconds before starting it again.",
    );
    await expect(replace.keepButton).toBeFocused();
    await expect(replace.replaceButton).toBeVisible();
  });

  test('shows the next segment and the segment-change banner in km/h', async ({
    page,
    api,
    events,
    audio,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState({ workout: treadmillWorkout({ segment: 10, remaining: 1 }) }));
    await expect(ride.intervalNext).toHaveText('Next: Work 0:40 at 9.0 km/h, 0%');
    await ride.beepsButton.click();
    await ride.push(treadmillState({ workout: treadmillWorkout({ segment: 11, remaining: 40 }) }));
    await expect(ride.phaseHeadline).toHaveText('WORK · 9.0 KM/H · 0% · GO!');
    await expect(ride.phaseDetail).toHaveText('Round 6 of 18 · 0:40');
    await expect(ride.cueAnnouncement).toHaveText('Work, 9.0 km/h, incline 0%, 40 seconds');
    await expect(ride.intervalNext).toHaveText('Next: Recover 0:20 at 7.0 km/h, 0%');
    await ride.push(treadmillState({ workout: treadmillWorkout({ segment: 12, remaining: 20 }) }));
    await expect(ride.phaseHeadline).toHaveText('RECOVER · 7.0 KM/H · 0%');
    await expect(ride.phaseDetail).toHaveText('0:20 · next: Work at 9.0 km/h');
    expect((await audio.tones()).length).toBeGreaterThan(0);
  });

  test('titles the trace Speed vs. plan with an incline lane (AC6)', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState({ incline: 1 }));
    await expect(ride.traceTitle).toHaveText('Speed vs. plan · incline below');
    await expect(ride.traceLegend).toHaveText(['Actual', 'Work', 'Recover']);
    await expect(ride.traceMax).toHaveText('15 km/h');
    await expect(ride.traceTicks).toHaveText([
      '0:00',
      '3:00',
      '6:00',
      '9:00',
      '12:00',
      '15:00',
      '18:00',
      '21:00',
    ]);
    await expect(ride.traceCanvas).toBeAttached();
    await expect(ride.inclineLaneMax).toHaveText('10%');
    await expect(ride.inclineLane).toHaveAccessibleName(
      "Incline profile: the plan dashed, the deck's actual incline filled",
    );
    await expect(ride.inclineLanePlan).toHaveAttribute('points', /.+/);
    await ride.push(
      treadmillState({ incline: 1, workout: treadmillWorkout({ elapsed_seconds: 428 }) }),
    );
    await expect(ride.inclineLaneActual).toHaveAttribute('points', /^427,9 /);

    await ride.push(
      treadmillState({
        workout: treadmillWorkout({
          plan: { ...FLAT_PLAN, level: null, cadence: null, speed: 9, incline: 0 },
        }),
      }),
    );
    await expect(ride.traceLegend).toHaveText(['Actual', 'Work']);
  });

  test('titles the log Sent to treadmill with the newest 4 SPD and INC entries', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(treadmillState());
    await expect(ride.treadmillCommandTitle).toHaveText('Sent to treadmill');
    await expect(ride.treadmillCommandLink).toHaveText('BLE · 000766');
    await expect(ride.treadmillCommandEntries).toHaveText([
      '7:00INC 0% · planack 46ms',
      '7:00SPD 9.0 · planack 612ms',
      '6:40INC 0% · planack 44ms',
      '6:40SPD 7.0 · planack 588ms',
    ]);
    await ride.push(treadmillState({ commands: [] }));
    await expect(ride.treadmillCommandEntries).toHaveText(['No commands yet this session.']);
  });
});

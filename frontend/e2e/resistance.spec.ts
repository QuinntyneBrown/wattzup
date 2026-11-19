import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { NOW_S, flatWorkout, freeRide, state, workout } from './fixtures/states';

test.describe('Resistance readout (L2-019)', () => {
  test('shows the level of 32 and lights levels up to it', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.levelValue).toHaveText('18');
    await expect(ride.levelOf).toHaveText('of 32');
    await expect(ride.pickerLevels).toHaveCount(32);
    await expect(ride.litLevels).toHaveCount(18);
    await expect(ride.picker).toHaveAttribute('aria-valuenow', '18');
    await expect(ride.picker).toHaveAttribute('aria-valuetext', 'Level 18 of 32');
    await expect(ride.levelSetting).toHaveCount(0);
  });

  test('shows -- and lights nothing with no resistance', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ resistance: null, target_resistance: null }));
    await expect(ride.levelValue).toHaveText('--');
    await expect(ride.litLevels).toHaveCount(0);
  });

  test('reads Setting 22… and sets the picker to 22 while the bike catches up', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ target_resistance: 22, workout: workout({ mode: 'manual' }) }));
    await expect(ride.levelValue).toHaveText('18');
    await expect(ride.levelSetting).toHaveText('Setting 22…');
    await expect(ride.picker).toHaveAttribute('aria-valuenow', '22');
  });

  test('outlines the plan level in manual mode', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(
      state({ resistance: 22, target_resistance: 22, workout: workout({ mode: 'manual' }) }),
    );
    await expect(ride.planLevels).toHaveCount(1);
    await expect(ride.level(18)).toHaveClass(/is-plan/);
  });
});

test.describe('Resistance controls (L2-020)', () => {
  test('Raise and Lower send one level up and down', async ({ page, api, events }) => {
    api.on('POST', '/api/resistance', { json: { level: 11 } });
    const ride = new RidePage(page, api, events);
    await ride.open(freeRide({ resistance: 10, target_resistance: 10 }));
    await ride.raiseButton.click();
    await ride.lowerButton.click();
    const calls = await api.waitForCall('POST', '/api/resistance', 2);
    expect(calls.map((c) => c.body)).toEqual([{ level: 11 }, { level: 9 }]);
  });

  test('steps from the target, then from 12, when nothing is reported', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/resistance', { json: { level: 16 } });
    const ride = new RidePage(page, api, events);
    await ride.open(freeRide({ resistance: null, target_resistance: 15 }));
    await ride.raiseButton.click();
    await api.waitForCall('POST', '/api/resistance', 1);
    await ride.push(freeRide({ resistance: null, target_resistance: null }));
    await expect(ride.levelValue).toHaveText('--');
    await ride.raiseButton.click();
    await ride.lowerButton.click();
    const calls = await api.waitForCall('POST', '/api/resistance', 3);
    expect(calls.map((c) => c.body)).toEqual([{ level: 16 }, { level: 13 }, { level: 11 }]);
  });

  test('tapping a bar of the picker sends that level', async ({ page, api, events }) => {
    api.on('POST', '/api/resistance', { json: { level: 22 } });
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await ride.level(22).click();
    const [call] = await api.waitForCall('POST', '/api/resistance');
    expect(call.body).toEqual({ level: 22 });
  });

  test('the picker is one target the full width of the panel and at least 44 px tall', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    const box = await ride.picker.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await expect(ride.picker.getByRole('button')).toHaveCount(0);
  });

  test('disables Lower at 1 and Raise at 32', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(freeRide({ resistance: 1, target_resistance: 1 }));
    await expect(ride.lowerButton).toBeDisabled();
    await expect(ride.raiseButton).toBeEnabled();
    await ride.push(freeRide({ resistance: 32, target_resistance: 32 }));
    await expect(ride.raiseButton).toBeDisabled();
    await expect(ride.lowerButton).toBeEnabled();
  });

  test('disables every control until the bike connects', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ ble: 'connecting' }));
    await expect(ride.lowerButton).toBeDisabled();
    await expect(ride.raiseButton).toBeDisabled();
    await expect(ride.picker).toHaveAttribute('aria-disabled', 'true');
    await ride.level(5).click();
    expect(api.calls('POST', '/api/resistance')).toHaveLength(0);
    await expect(ride.planNote).toHaveText('Resistance controls wake up once the bike connects.');
  });
});

test.describe('Plan note and back to plan (L2-047)', () => {
  const notes = [
    ['hiit in plan mode', state(), 'Following the plan — levels change with each interval.'],
    [
      'flat in plan mode',
      state({ workout: flatWorkout() }),
      'Holding a flat level for the whole ride.',
    ],
    ['no workout', freeRide(), 'Manual control — no plan is running.'],
  ] as const;
  for (const [name, s, text] of notes) {
    test(`reads the note for ${name}`, async ({ page, api, events }) => {
      const ride = new RidePage(page, api, events);
      await ride.open(s);
      await expect(ride.planNote).toHaveText(text);
      await expect(ride.backToPlanButton).toHaveCount(0);
    });
  }

  test('offers Back to plan in manual mode and posts it', async ({ page, api, events }) => {
    api.on('POST', '/api/workout/back-to-plan', { json: { workout: workout() } });
    const ride = new RidePage(page, api, events);
    await ride.open(
      state({ resistance: 22, target_resistance: 22, workout: workout({ mode: 'manual' }) }),
    );
    await expect(ride.planNote).toContainText('Manual level. Plan takes over next interval.');
    await ride.backToPlanButton.click();
    await api.waitForCall('POST', '/api/workout/back-to-plan');
  });

  test('names the plan level for a flat ride in manual mode', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ workout: flatWorkout({ mode: 'manual' }) }));
    await expect(ride.planNote).toContainText('Manual level. Plan was 12.');
  });
});

test.describe('Command log (L2-048)', () => {
  test('lists each command with ride time, level, source and status', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(
      state({
        commands: [
          {
            at: NOW_S,
            ride_seconds: 425,
            level: 22,
            source: 'manual',
            status: 'sending',
            ack_ms: null,
          },
          {
            at: NOW_S - 6,
            ride_seconds: 421,
            level: 18,
            source: 'plan',
            status: 'ack',
            ack_ms: 40,
          },
          {
            at: NOW_S - 9,
            ride_seconds: 418,
            level: 6,
            source: 'plan',
            status: 'failed',
            ack_ms: null,
          },
        ],
      }),
    );
    await expect(ride.commandLogConnection).toHaveText('BLE · 0bf669f1');
    await expect(ride.commandEntries).toHaveText([
      '7:05RES 22 · manualsending',
      '7:01RES 18 · planack 40ms',
      '6:58RES 6 · planfailed',
    ]);
    await expect(ride.commandEntries.nth(0).locator('.sending')).toBeVisible();
    await expect(ride.commandEntries.nth(1).locator('.ack')).toBeVisible();
    await expect(ride.commandEntries.nth(2).locator('.failed')).toBeVisible();
  });

  test('uses the local time for a command sent with no workout', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(
      freeRide({
        commands: [
          {
            at: NOW_S,
            ride_seconds: null,
            level: 9,
            source: 'manual',
            status: 'ack',
            ack_ms: 38,
          },
        ],
      }),
    );
    await expect(ride.commandEntries).toHaveText(['7:10:12RES 9 · manualack 38ms']);
  });

  test('reads No commands yet this session. with none', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(freeRide());
    await expect(ride.commandEntries).toHaveText(['No commands yet this session.']);
  });
});

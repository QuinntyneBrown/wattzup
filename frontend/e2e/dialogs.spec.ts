import classes from './fixtures/recorded/classes.json';
import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { DiagnosticsDialog } from './pages/diagnostics.dialog';
import { EndRideDialog } from './pages/end-ride.dialog';
import { NOW_S, state, workout } from './fixtures/states';

const PACKETS = [
  '1794787812.127 f0 d1 09 00 1b 00 00 00 00 00 5f 00 ee',
  '1794787811.120 f0 d1 09 00 1a 00 00 00 00 00 5e 00 ec',
  '1794787810.902 f0 d2 01 12 d5',
];

test.describe('Diagnostics dialog (L2-023)', () => {
  test.beforeEach(({ api }) => {
    api.on('GET', '/api/diagnostics/packets', { json: { lines: PACKETS } });
  });

  test('lists what Wattzup sees and the latest packets', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    const diag = new DiagnosticsDialog(page);
    await ride.open(
      state({
        transport: 'WinRT (Windows.Devices.Bluetooth)',
        packets: 2517,
        displayed_seconds: 2490,
        last_data_at: NOW_S,
      }),
    );
    await ride.diagnosticsButton.click();
    await expect(diag.dialog).toBeVisible();
    await expect(diag.description).toHaveText(
      'What Wattzup sees right now. Copy this when reporting a problem.',
    );
    await expect(diag.terms).toHaveText([
      'Server',
      'Bluetooth',
      'Transport',
      'Packets',
      'Live on screen',
      'Last update',
      'Trace renderer',
      'Last error',
    ]);
    await expect(diag.value('Server')).toHaveText('Connected · event stream open · 2 viewers');
    await expect(diag.value('Bluetooth')).toHaveText('connected · ECHEX-3-141844 (Echelon EX-5s)');
    await expect(diag.value('Transport')).toHaveText('WinRT (Windows.Devices.Bluetooth)');
    await expect(diag.value('Packets')).toHaveText('2,517');
    await expect(diag.value('Live on screen')).toHaveText('41 min 30 s');
    await expect(diag.value('Last update')).toHaveText('7:10:12 PM');
    await expect(diag.value('Last error')).toHaveText('None');
    await expect(diag.packetsHeading).toBeVisible();
    await expect(diag.packets).toHaveText(PACKETS.join('\n'));
    await api.waitForCall('GET', '/api/diagnostics/packets');
  });

  test('reads Offline while the stream is down', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    const diag = new DiagnosticsDialog(page);
    await ride.open(state());
    await events.fail();
    await ride.diagnosticsButton.click();
    await expect(diag.value('Server')).toHaveText('Offline · retrying every 2 s');
  });

  test('Copy details copies the values and packet lines as plain text', async ({
    page,
    context,
    api,
    events,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const ride = new RidePage(page, api, events);
    const diag = new DiagnosticsDialog(page);
    await ride.open(state({ error: 'adapter reset' }));
    await ride.diagnosticsButton.click();
    await expect(diag.packets).toHaveText(PACKETS.join('\n'));
    await diag.copyButton.click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain('Last error: adapter reset');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.startsWith('Server: Connected · event stream open · 2 viewers\n')).toBe(true);
    expect(copied.endsWith(`\n\n${PACKETS.join('\n')}`)).toBe(true);
  });

  for (const how of ['Done', 'Escape', 'Close'] as const) {
    test(`${how} closes it and returns focus to Diagnostics`, async ({ page, api, events }) => {
      const ride = new RidePage(page, api, events);
      const diag = new DiagnosticsDialog(page);
      await ride.open(state());
      await ride.diagnosticsButton.click();
      await expect(diag.dialog).toBeVisible();
      if (how === 'Done') await diag.doneButton.click();
      else if (how === 'Close') await diag.closeButton.click();
      else await page.keyboard.press('Escape');
      await expect(diag.dialog).toHaveCount(0);
      await expect(ride.diagnosticsButton).toBeFocused();
    });
  }
});

test.describe('End-ride dialog (L2-051)', () => {
  test('asks to end with the elapsed time and level, focused on Keep riding', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    const end = new EndRideDialog(page);
    await ride.open(state({ workout: workout({ status: 'paused' }) }));
    await ride.endButton.click();
    await expect(end.description).toHaveText(
      "You're 7:07 into 12:40. Wattzup stops changing the resistance and leaves the bike at level 18.",
    );
    await expect(end.note).toHaveText(
      'Your power trace and totals stay on the dashboard until you start a new ride.',
    );
    await expect(end.keepRidingButton).toBeFocused();
  });

  test('End ride stops the workout and goes to the class library', async ({
    page,
    api,
    events,
  }) => {
    api.on('GET', '/api/classes', { json: classes });
    let release: () => void = () => undefined;
    const answered = new Promise<void>((r) => (release = r));
    api.on('POST', '/api/workout/stop', async () => {
      await answered;
      return { json: { stopped: workout({ status: 'stopped' }) } };
    });
    const ride = new RidePage(page, api, events);
    const end = new EndRideDialog(page);
    await ride.open(state());
    await ride.endButton.click();
    await end.endRideButton.click();
    await expect(end.endingButton).toBeDisabled();
    await expect(end.keepRidingButton).toBeDisabled();
    release();
    await expect(end.dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/classes$/);
  });

  test('a failed stop says the ride is still running and offers Try again', async ({
    page,
    api,
    events,
  }) => {
    let calls = 0;
    api.on('GET', '/api/classes', { json: classes });
    api.on('POST', '/api/workout/stop', () =>
      ++calls === 1
        ? { status: 500, json: { title: 'error', status: 500 } }
        : { json: { stopped: workout({ status: 'stopped' }) } },
    );
    const ride = new RidePage(page, api, events);
    const end = new EndRideDialog(page);
    await ride.open(state());
    await ride.endButton.click();
    await end.endRideButton.click();
    await expect(end.error).toContainText("Couldn't end the ride");
    await expect(end.error).toContainText(
      "The Wattzup server didn't answer. The ride is still running — try again.",
    );
    await end.tryAgainButton.click();
    await expect(page).toHaveURL(/\/classes$/);
  });

  for (const how of ['Keep riding', 'Escape', 'Close'] as const) {
    test(`${how} closes it, the ride continues and focus returns to End`, async ({
      page,
      api,
      events,
    }) => {
      const ride = new RidePage(page, api, events);
      const end = new EndRideDialog(page);
      await ride.open(state());
      await ride.endButton.click();
      await expect(end.dialog).toBeVisible();
      if (how === 'Keep riding') await end.keepRidingButton.click();
      else if (how === 'Close') await end.closeButton.click();
      else await page.keyboard.press('Escape');
      await expect(end.dialog).toHaveCount(0);
      await expect(ride.endButton).toBeFocused();
      expect(api.calls('POST', '/api/workout/stop')).toHaveLength(0);
    });
  }
});

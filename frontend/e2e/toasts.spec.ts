import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { ToastRegion } from './pages/toast-region';
import { NOW, NOW_S, freeRide, state, workout } from './fixtures/states';

const manual = (status: string, ack_ms: number | null = null) => ({
  at: NOW_S + 1,
  ride_seconds: null,
  level: 20,
  source: 'manual',
  status,
  ack_ms,
});

test.describe('Resistance command toasts (L2-020, L2-048)', () => {
  test('a 503 shows Couldn’t set resistance with the bike hint', async ({ page, api, events }) => {
    api.on('POST', '/api/resistance', {
      status: 503,
      json: { title: 'Service Unavailable', status: 503, code: 'bike_not_connected' },
    });
    const ride = new RidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await ride.open(state());
    await ride.raiseButton.click();
    const toast = toasts.toast("Couldn't set resistance");
    await expect(toasts.text(toast)).toHaveText(
      "The bike isn't connected. Pedal to wake it, then try again.",
    );
    await expect(toast).toHaveAttribute('role', 'alert');
    await expect(toast).toHaveClass(/toast--danger/);
  });

  test('a timeout after 5 s offers Retry, which resends the same level', async ({
    page,
    api,
    events,
  }) => {
    await page.clock.install({ time: NOW });
    let calls = 0;
    api.on('POST', '/api/resistance', () =>
      ++calls === 1 ? { hang: true } : { json: { level: 22 } },
    );
    const ride = new RidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await ride.open(state());
    await ride.level(22).click();
    await api.waitForCall('POST', '/api/resistance');
    await page.clock.runFor(5100);
    const toast = toasts.toast("Couldn't set resistance");
    await expect(toasts.text(toast)).toHaveText(
      "The server didn't answer (timeout after 5 s). Level 22 was not sent.",
    );
    await toasts.action(toast, 'Retry').click();
    const sent = await api.waitForCall('POST', '/api/resistance', 2);
    expect(sent[1].body).toEqual({ level: 22 });
    await expect(toast).toHaveCount(0);
  });

  test('an acknowledged manual command shows Resistance set to <n>', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await ride.open(freeRide());
    await ride.push(freeRide({ commands: [manual('sending')] }));
    await ride.push(
      freeRide({ resistance: 20, target_resistance: 20, commands: [manual('ack', 38)] }),
    );
    const toast = toasts.toast('Resistance set to 20');
    await expect(toasts.text(toast)).toHaveText('Echelon EX-5s confirmed level 20 in 38 ms.');
    await expect(toast).toHaveClass(/toast--success/);
  });

  test('no toast for plan commands or entries already acknowledged on load', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await ride.open(freeRide({ commands: [manual('ack', 40)] }));
    await ride.push(state());
    await expect(ride.levelValue).toHaveText('18');
    await expect(toasts.toasts).toHaveCount(0);
  });

  test('a manual command still sending after 5 s warns until it is acknowledged', async ({
    page,
    api,
    events,
  }) => {
    await page.clock.install({ time: NOW });
    const ride = new RidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await ride.open(freeRide());
    await ride.push(
      freeRide({
        target_resistance: 22,
        commands: [{ ...manual('sending'), level: 22 }],
      }),
    );
    await page.clock.runFor(4000);
    await expect(toasts.toasts).toHaveCount(0);
    await page.clock.runFor(1100);
    const toast = toasts.toast('Bike is slow to confirm');
    await expect(toasts.text(toast)).toHaveText(
      'Still setting level 22 — Wattzup resends every 5 seconds until the bike reports it.',
    );
    await expect(toast).toHaveClass(/toast--warning/);
    await ride.push(
      freeRide({
        resistance: 22,
        target_resistance: 22,
        commands: [{ ...manual('ack', 5400), level: 22 }],
      }),
    );
    await expect(toast).toHaveCount(0);
    await expect(toasts.toast('Resistance set to 22')).toBeVisible();
  });
});

test.describe('Pause and resume failures (L2-046)', () => {
  test('a failed pause shows Couldn’t pause the ride', async ({ page, api, events }) => {
    api.on('POST', '/api/workout/pause', { status: 500, json: { title: 'error', status: 500 } });
    const ride = new RidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await ride.open(state());
    await ride.pauseButton.click();
    const toast = toasts.toast("Couldn't pause the ride");
    await expect(toasts.text(toast)).toHaveText("The Wattzup server didn't answer. Try again.");
  });

  test('a failed resume shows Couldn’t resume the ride', async ({ page, api, events }) => {
    api.on('POST', '/api/workout/resume', { abort: true });
    const ride = new RidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await ride.open(state({ workout: workout({ status: 'paused' }) }));
    await ride.resumeButton.click();
    await expect(toasts.toast("Couldn't resume the ride")).toBeVisible();
  });
});

test.describe('Toasts (L2-053)', () => {
  test('info and success toasts leave after 5 s, paused while hovered', async ({
    page,
    api,
    events,
  }) => {
    await page.clock.install({ time: NOW });
    const ride = new RidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await ride.open(freeRide());
    await ride.push(freeRide({ commands: [manual('sending')] }));
    await ride.push(freeRide({ commands: [manual('ack', 38)] }));
    const toast = toasts.toast('Resistance set to 20');
    await expect(toast).toBeVisible();
    await toast.hover();
    await page.clock.runFor(8000);
    await expect(toast).toBeVisible();
    await page.mouse.move(0, 0);
    await page.clock.runFor(5100);
    await expect(toast).toHaveCount(0);
  });

  test('danger toasts stay until dismissed with Dismiss', async ({ page, api, events }) => {
    await page.clock.install({ time: NOW });
    api.on('POST', '/api/workout/pause', { status: 500, json: { title: 'error', status: 500 } });
    const ride = new RidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await ride.open(state());
    await ride.pauseButton.click();
    const toast = toasts.toast("Couldn't pause the ride");
    await expect(toast).toBeVisible();
    await page.clock.runFor(60_000);
    await expect(toast).toBeVisible();
    await toasts.dismiss(toast).click();
    await expect(toast).toHaveCount(0);
  });

  test('shows at most 3, newest at the bottom, oldest info or success leaving first', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout/pause', { status: 500, json: { title: 'error', status: 500 } });
    const ride = new RidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await ride.open(freeRide());
    await ride.push(freeRide({ commands: [manual('sending')] }));
    await ride.push(freeRide({ commands: [manual('ack', 38)] }));
    await expect(toasts.toasts).toHaveCount(1);
    await ride.push(state());
    await ride.pauseButton.click();
    await ride.pauseButton.click();
    await expect(toasts.toasts).toHaveCount(3);
    await ride.pauseButton.click();
    await expect(toasts.toasts).toHaveCount(3);
    await expect(toasts.toast('Resistance set to 20')).toHaveCount(0);
    await expect(toasts.region).toHaveAttribute('role', 'status');
    await expect(toasts.region).toHaveAttribute('aria-live', 'polite');
  });
});

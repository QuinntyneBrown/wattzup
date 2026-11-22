// Acceptance test
// Traces to: L2-135 AC1, AC2; L2-074 AC3; L2-130 AC1
// Description: a ride that finishes without a network, or with the backend out of reach, waits on the device: it is
// kept in IndexedDB with its id and Results shows its XP pending. When the app is next open with the backend in reach,
// waiting rides are sent oldest first and removed from the device once recorded. While the backend stays out of reach
// the ride is sent again after 30 seconds, then a minute, the delay growing each time. A ride the backend refuses with
// 429 is sent again when the Retry-After it was given has passed, not on the growing delay.
import { RIDE_RECORDED } from './fixtures/api';
import { openResults, soloRace } from './fixtures/results';
import { ridesWaiting } from './fixtures/rides-waiting';
import { expect, test } from './fixtures/test';
import { ResultsPage } from './pages/results.page';

/** The ride ids of the rides sent. */
function rideIds(bodies: unknown[]): string[] {
  return (bodies as { rideId: string }[]).map((ride) => ride.rideId);
}

/** A solo race that finished at `finishedAt`. */
function finishedAt(at: string) {
  const state = soloRace(1598);
  return { ...state, ride: { ...state.ride, finishedAt: at } };
}

test.describe('Rides waiting on the device', () => {
  test('a ride finished without a network waits on the device, and is sent and removed when the app opens online (L2-135 AC1, AC2) @critical', async ({
    page,
    api,
  }) => {
    const state = finishedAt('2026-11-21T07:30:00.000Z');
    api.answer('POST', '/api/rides', () => ({ offline: true }));

    await openResults(page, state);

    await expect(new ResultsPage(page).xpNote).toHaveText(
      'Your XP will be added when you’re back online.',
    );
    await expect.poll(() => ridesWaiting(page)).toEqual([state.ride.rideId]);

    const before = api.sentBodies('POST', '/api/rides').length;
    api.answer('POST', '/api/rides', RIDE_RECORDED);
    await page.goto('/');

    await expect.poll(() => ridesWaiting(page)).toEqual([]);
    expect(rideIds(api.sentBodies('POST', '/api/rides').slice(before))).toContain(
      state.ride.rideId,
    );
  });

  test('waiting rides are sent oldest first (L2-135 AC2)', async ({ page, api }) => {
    const later = finishedAt('2026-11-21T07:30:00.000Z');
    const earlier = finishedAt('2026-11-21T06:45:00.000Z');
    api.answer('POST', '/api/rides', () => ({ offline: true }));
    await openResults(page, later);
    await expect.poll(() => ridesWaiting(page)).toEqual([later.ride.rideId]);
    await openResults(page, earlier);
    await expect.poll(() => ridesWaiting(page)).toEqual([earlier.ride.rideId, later.ride.rideId]);

    api.answer('POST', '/api/rides', RIDE_RECORDED);
    await page.goto('/');

    // Once both are recorded and gone, the last two rides sent are the two, the one that finished first first.
    await expect.poll(() => ridesWaiting(page)).toEqual([]);
    expect(rideIds(api.sentBodies('POST', '/api/rides')).slice(-2)).toEqual([
      earlier.ride.rideId,
      later.ride.rideId,
    ]);
  });

  test('while the backend is out of reach the ride is sent again after 30 seconds, then a minute (L2-135 AC2)', async ({
    page,
    api,
  }) => {
    await page.clock.install({ time: new Date('2026-11-21T08:00:00Z') });
    const state = finishedAt('2026-11-21T07:30:00.000Z');
    api.answer('POST', '/api/rides', () => ({ status: 503 }));
    await openResults(page, state);
    const results = new ResultsPage(page);
    await expect(results.xpNote).toHaveText('Your XP will be added when you’re back online.');
    const sent = () =>
      rideIds(api.sentBodies('POST', '/api/rides')).filter((id) => id === state.ride.rideId).length;
    await expect.poll(sent).toBeGreaterThan(0);
    const first = sent();

    await page.clock.runFor(29_000);
    expect(sent()).toBe(first);
    await page.clock.runFor(1_000);
    await expect.poll(sent).toBe(first + 1);

    await page.clock.runFor(59_000);
    expect(sent()).toBe(first + 1);
    api.answer('POST', '/api/rides', RIDE_RECORDED);
    await page.clock.runFor(1_000);
    await expect.poll(sent).toBe(first + 2);
    await expect(results.xpTotal).toHaveText('+110');
    await expect.poll(() => ridesWaiting(page)).toEqual([]);
  });

  test('a ride refused with 429 is sent again when its Retry-After has passed (L2-130 AC1)', async ({
    page,
    api,
  }) => {
    await page.clock.install({ time: new Date('2026-11-21T08:00:00Z') });
    const state = finishedAt('2026-11-21T07:30:00.000Z');
    api.answer('POST', '/api/rides', () => ({
      status: 429,
      headers: { 'Retry-After': '5' },
      body: { status: 429, title: "This can't be done right now.", code: 'rate_limited' },
    }));
    await openResults(page, state);
    const results = new ResultsPage(page);
    await expect(results.xpNote).toHaveText('Your XP will be added when you’re back online.');
    const sent = () =>
      rideIds(api.sentBodies('POST', '/api/rides')).filter((id) => id === state.ride.rideId).length;
    await expect.poll(sent).toBeGreaterThan(0);
    const first = sent();
    await expect.poll(() => ridesWaiting(page)).toEqual([state.ride.rideId]);

    api.answer('POST', '/api/rides', RIDE_RECORDED);
    await page.clock.runFor(5_000);
    await expect.poll(sent).toBe(first + 1);
    await expect(results.xpTotal).toHaveText('+110');
    await expect.poll(() => ridesWaiting(page)).toEqual([]);
  });
});

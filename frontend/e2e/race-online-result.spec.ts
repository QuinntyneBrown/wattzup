// Acceptance test
// Traces to: L2-125 AC1; L2-044 AC2
// Description: a riders-online race is submitted with its session, so the service gives it the place, time and output
// it recorded. Until the service has recorded the race's result it answers 409 result_pending; the outbox sends the
// same ride again 5 seconds later, and Results, headed "Live race", shows "Recording your ride…" meanwhile, then the XP
// it earned.
// Old Town Criterium is served 0.5 km long, so the line is reached in a spec's minute.
import type { Page } from '@playwright/test';
import { RIDE_RECORDED, type Handler } from './fixtures/api';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { openRace } from './fixtures/live-race';
import { maps } from './fixtures/maps';
import { RACE_SESSION } from './fixtures/race-lobby';
import { expect, test } from './fixtures/test';
import { ResultsPage } from './pages/results.page';

const shortCriterium = maps.map((map) =>
  map.id === 'old-town-criterium' ? { ...map, distanceKm: 0.5 } : map,
);

/** The service's answer while the race's result is not recorded yet (L2-125 AC1). */
const RESULT_PENDING = {
  status: 409,
  body: { status: 409, title: "The race's result is not recorded yet.", code: 'result_pending' },
};

/**
 * Rides 661 W (120 rpm on level 32, 32.09 km/h) until the race is sent, a frame every 4 s. It stops once the ride's
 * POST has gone rather than when Results opens, which can come a step later on a slow machine: another 4 s would pass
 * the outbox's 5-second retry before the spec reads "Recording your ride…".
 */
async function rideToTheLine(page: Page, bluetooth: FakeBluetooth) {
  let sent = false;
  void page
    .waitForRequest(
      (request) => request.method() === 'POST' && request.url().endsWith('/api/rides'),
    )
    .then(() => (sent = true));
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(32));
  for (let second = 0; second < 120 && !sent; second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(120));
    await page.clock.runFor(4000);
  }
}

test(
  'a riders-online race is submitted with its session, and sent again until the service has its result (L2-125 AC1)',
  { tag: '@critical' },
  async ({ page, hub, bluetooth, api }) => {
    api.answer('GET', '/api/maps', shortCriterium);
    let sent = 0;
    const pendingOnce: Handler = (request) =>
      ++sent === 1 ? RESULT_PENDING : RIDE_RECORDED(request);
    api.answer('POST', '/api/rides', pendingOnce);
    await openRace(page, hub, bluetooth, 4_500);
    const pending = page.waitForResponse((response) => response.url().endsWith('/api/rides'));

    await rideToTheLine(page, bluetooth);

    const results = new ResultsPage(page);
    await expect(page).toHaveURL('/results');
    // Change detection waits on a timer, so the paused clock moves a tenth of a second at a time until Results renders,
    // far short of the 5-second retry (L157).
    await expect(async () => {
      await page.clock.runFor(100);
      await expect(results.context).toHaveText('Old Town Criterium · Live race', { timeout: 100 });
    }).toPass();
    await expect(results.xpNote).toHaveText('Recording your ride…');
    expect((await pending).status()).toBe(409);
    // The retry's 5 seconds count from when the page handled the 409, so the clock steps a second at a time (L170).
    await expect(async () => {
      await page.clock.runFor(1_000);
      await expect(results.xpTotal).toHaveText('+110', { timeout: 100 });
    }).toPass();
    expect(sent).toBe(2);
    const [first, again] = api.sentBodies('POST', '/api/rides') as Record<string, unknown>[];
    expect(first).toMatchObject({
      kind: 'race',
      mode: 'online',
      sessionId: RACE_SESSION,
      pack: null,
    });
    expect(again).toEqual(first);
  },
);

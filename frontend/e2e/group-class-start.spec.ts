// Acceptance test
// Traces to: L2-087 AC1, AC4; L2-122 AC3; L2-121 AC3
// Description: a group class ride that has its seat waits for the session's start: the header reads "· Group" with no
// Pause, the clock holds at 0:00 and the video is parked under "Starts in 9:00", which counts down. When the server's
// time reaches the start, measured through the clock offset, the clock and the video start together, so every rider
// starts at the same moment. A rider who arrives after the start (a reload or a rejoin) starts at the session's time.
import { hiitCardio, hiitSession, seated, SESSIONS_NOW } from './fixtures/classes';
import { echelonBike } from './fixtures/echelon';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/test';
import { ClassRidePage } from './pages/class-ride.page';

/** Opens the group ride and, once it has its seat, stands the page's clock just past SESSIONS_NOW. */
async function openAt(page: Page, ride: ClassRidePage, sessionId: string): Promise<void> {
  await ride.openGroup(hiitCardio.id, sessionId);
  await expect(ride.name).toHaveText('30 Minute HIIT Cardio · Group');
  // Seated: it waits, or it has started. SignalR's own timers need the clock running until then.
  await expect(ride.wait.or(ride.clock.filter({ hasNotText: /^0:00/ }))).toBeVisible();
  // A jump does not fire the second timers in order, so the last second is run. The clock stands half a second past
  // SESSIONS_NOW: the few milliseconds the measured clock offset is off by cannot tip a whole second.
  await page.clock.pauseAt(SESSIONS_NOW - 500);
  await page.clock.runFor(1_000);
}

test.describe('Starting a group class together', () => {
  test.beforeEach(async ({ page, bluetooth, hub }) => {
    // The clock runs while the page loads, then stands at SESSIONS_NOW (open), so the times read are exact.
    await page.clock.install({ time: SESSIONS_NOW - 10_000 });
    await bluetooth.remember(echelonBike);
    hub.open();
    // The server's clock is the page's installed clock, so the session's start falls where the spec puts it.
    hub.answer('ServerTime', () => page.evaluate(() => Date.now()));
  });

  test('the ride holds at 0:00 with the video parked under the time left to the start (L2-087 AC1, AC4) @critical', async ({
    page,
    hub,
    youtube,
  }) => {
    const session = hiitSession('2026-11-21T19:39:00Z', []);
    hub.answer('JoinClassSession', () => seated(session));
    const ride = new ClassRidePage(page);

    await openAt(page, ride, session.id);

    await expect(ride.waitTime).toHaveText('9:00');
    await expect(ride.waitNote).toHaveText(
      'The video and the clock start with the group at 7:39 PM.',
    );
    await expect(ride.clock).toHaveText(/^0:00/);
    await expect(ride.pause).toHaveCount(0);
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    expect((await youtube.players())[0].playing).toBe(false);

    await page.clock.runFor(60_000);

    await expect(ride.waitTime).toHaveText('8:00');
    await expect(ride.clock).toHaveText(/^0:00/);
  });

  test('at the session’s start the clock and the video start together (L2-122 AC3)', async ({
    page,
    hub,
    youtube,
  }) => {
    const session = hiitSession('2026-11-21T19:30:30Z', []);
    hub.answer('JoinClassSession', () => seated(session));
    const ride = new ClassRidePage(page);
    await openAt(page, ride, session.id);
    await expect(ride.waitTime).toHaveText('0:30');

    await page.clock.runFor(30_000);

    await expect(ride.wait).toHaveCount(0);
    await expect.poll(async () => (await youtube.players())[0]?.playing).toBe(true);
    await page.clock.runFor(60_000);
    await expect(ride.clock).toHaveText(/^1:00/);
  });

  test('a rider who arrives after the start rides from the session’s time (L2-122 AC3)', async ({
    page,
    hub,
  }) => {
    const session = hiitSession('2026-11-21T19:28:00Z', []);
    hub.answer('JoinClassSession', () => seated(session));
    const ride = new ClassRidePage(page);

    await openAt(page, ride, session.id);

    await expect(ride.clock).toHaveText(/^2:00/);
    await expect(ride.wait).toHaveCount(0);
  });
});

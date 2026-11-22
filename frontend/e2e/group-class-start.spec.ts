// Acceptance test
// Traces to: L2-087 AC1; L2-122 AC3; L2-121 AC3; L2-154 AC3
// Description: a group class ride starts at the session's start: World loading counts down to it (L2-154, its own
// spec), and when the server's time reaches the start, measured through the clock offset, the class ride opens with
// its header reading "· Group" with no Pause, and the clock and the video start together, so every rider starts at the
// same moment. A rider who arrives after the start (a reload or a rejoin) starts at the session's time.
import type { Locator, Page } from '@playwright/test';
import { hiitCardio, hiitSession, seated, SESSIONS_NOW } from './fixtures/classes';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassRidePage } from './pages/class-ride.page';
import { WorldLoadingPage } from './pages/world-loading.page';

/** Steps the paused clock a tenth of a second at a time until `shown` is: change detection waits on a timer (L157). */
async function untilShown(page: Page, shown: Locator): Promise<void> {
  await expect(async () => {
    await page.clock.runFor(100);
    await expect(shown).toBeVisible({ timeout: 100 });
  }).toPass();
}

/**
 * Opens the group ride and, once it has its seat (World loading counting down, or the class ride if the session has
 * started), stands the page's clock just past SESSIONS_NOW.
 */
async function openAt(page: Page, ride: ClassRidePage, sessionId: string): Promise<void> {
  await ride.openGroup(hiitCardio.id, sessionId);
  // Seated: World loading counts down, or the ride has started. SignalR's own timers need the clock running until then.
  await expect(new WorldLoadingPage(page).groupTimer.or(ride.name)).toBeVisible();
  // A jump does not fire the second timers in order, so the last second is run. The clock stands half a second past
  // SESSIONS_NOW: the few milliseconds the measured clock offset is off by cannot tip a whole second.
  await page.clock.pauseAt(SESSIONS_NOW - 500);
  await page.clock.runFor(1_000);
}

test.describe('Starting a group class together', () => {
  test.beforeEach(async ({ page, bluetooth, hub, webgl }) => {
    // The clock runs while the page loads, then stands at SESSIONS_NOW (open), so the times read are exact.
    await page.clock.install({ time: SESSIONS_NOW - 10_000 });
    // The class rides its panorama: these specs ride the group's start, not its world.
    await webgl.disable();
    await bluetooth.remember(echelonBike);
    hub.open();
    // The server's clock is the page's installed clock, so the session's start falls where the spec puts it.
    hub.answer('ServerTime', () => page.evaluate(() => Date.now()));
  });

  test('at the session’s start the class ride opens, and the clock and the video start together (L2-087 AC1, L2-122 AC3, L2-154 AC3) @critical', async ({
    page,
    hub,
    youtube,
  }) => {
    const session = hiitSession('2026-11-21T19:30:30Z', []);
    hub.answer('JoinClassSession', () => seated(session));
    const ride = new ClassRidePage(page);
    await openAt(page, ride, session.id);
    await expect(new WorldLoadingPage(page).groupTimer).toHaveText('0:30');

    await page.clock.runFor(30_000);
    await untilShown(page, ride.name);

    await expect(ride.name).toHaveText('30 Minute HIIT Cardio · Group');
    await expect(ride.pause).toHaveCount(0);
    await expect(ride.wait).toHaveCount(0);
    // The player loads on the class ride, which the paused clock renders a tenth of a second at a time (L157).
    await expect(async () => {
      await page.clock.runFor(100);
      expect((await youtube.players())[0]?.playing).toBe(true);
    }).toPass();
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

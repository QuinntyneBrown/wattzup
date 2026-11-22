// Acceptance test
// Traces to: L2-122 AC1, AC2; L2-086 AC2, AC3; L2-085 AC3; L2-120 AC1, AC3; L2-082
// Description: Join on Class Start opens the group ride, which connects to the ride hub and asks for a seat in that
// session once, and stays. A full session refuses (session_full) and a started one refuses (session_started): the ride
// goes back to Class Start, which reads the sessions again and offers the next one; a locked class sends it to the
// Class Library. After a reconnect the ride asks for the same seat again.
import {
  hiitCardio,
  hiitSession,
  hiitSessions,
  refused,
  seated,
  SESSIONS_NOW,
  sixRiders,
} from './fixtures/classes';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';
import { ClassRidePage } from './pages/class-ride.page';
import { ClassStartPage } from './pages/class-start.page';

const SESSIONS = `/api/classes/${hiitCardio.id}/sessions`;

test.describe('Joining a group session', () => {
  test.beforeEach(async ({ page, bluetooth, hub }) => {
    await page.clock.install({ time: SESSIONS_NOW });
    await bluetooth.remember(echelonBike);
    hub.open();
    hub.answer('ServerTime', () => page.evaluate(() => Date.now()));
  });

  test('Join opens the group ride, which asks the hub for a seat in that session and stays (L2-085 AC3, L2-122 AC1) @critical', async ({
    page,
    api,
    hub,
  }) => {
    api.answer('GET', SESSIONS, hiitSessions);
    hub.answer('JoinClassSession', () => seated(hiitSessions[0]));
    const start = new ClassStartPage(page);
    await start.open(hiitCardio.id);

    await start.join.click();

    await expect
      .poll(() => hub.invocations('JoinClassSession'))
      .toEqual([[hiitCardio.id, hiitSessions[0].id]]);
    await expect(page).toHaveURL(`/classes/${hiitCardio.id}/ride?session=${hiitSessions[0].id}`);
    await expect(new ClassRidePage(page).leave).toBeVisible();
  });

  test('a full session refuses, and Class Start offers the next one (L2-122 AC2, L2-086 AC2)', async ({
    page,
    api,
    hub,
  }) => {
    const [full, next] = [hiitSession('2026-11-21T19:39:00Z', sixRiders, true), hiitSessions[1]];
    api.answer('GET', SESSIONS, [full, next]);
    hub.answer('JoinClassSession', () => refused('session_full', full, next));

    await new ClassRidePage(page).openGroup(hiitCardio.id, full.id);

    const start = new ClassStartPage(page);
    await expect(page).toHaveURL(`/classes/${hiitCardio.id}`);
    await expect(start.body(start.group)).toHaveText(
      'This session is full. Next one starts 15 minutes later.',
    );
    await expect(start.join).toHaveText('Join the next session');
  });

  test('a session that has started refuses, and Class Start offers the next one (L2-086 AC3)', async ({
    page,
    api,
    hub,
  }) => {
    const started = hiitSession('2026-11-21T19:24:00Z', sixRiders);
    api.answer('GET', SESSIONS, hiitSessions);
    hub.answer('JoinClassSession', () => refused('session_started', started, hiitSessions[0]));

    await new ClassRidePage(page).openGroup(hiitCardio.id, started.id);

    const start = new ClassStartPage(page);
    await expect(page).toHaveURL(`/classes/${hiitCardio.id}`);
    await expect(start.body(start.group)).toHaveText('7:39 PM · starts in 9 min · 6 of 10 riders');
    await expect(start.join).toHaveText('Join · starts in 9 min');
  });

  test('a class above the rider’s level refuses, and the ride goes to the Class Library (L2-082)', async ({
    page,
    hub,
  }) => {
    hub.answer('JoinClassSession', () => ({
      code: 'class_locked',
      sessionId: hiitSessions[0].id,
      startsAt: null,
      jersey: null,
      next: null,
    }));

    await new ClassRidePage(page).openGroup(hiitCardio.id, hiitSessions[0].id);

    await expect(page).toHaveURL('/classes');
    await expect(new ClassLibraryPage(page).heading).toBeVisible();
  });

  test('after a reconnect the ride asks for the same seat again (L2-120 AC3)', async ({
    page,
    hub,
  }) => {
    hub.answer('JoinClassSession', () => seated(hiitSessions[0]));
    await new ClassRidePage(page).openGroup(hiitCardio.id, hiitSessions[0].id);
    await expect.poll(() => hub.invocations('JoinClassSession').length).toBe(1);

    await hub.drop();

    await expect
      .poll(() => hub.invocations('JoinClassSession'))
      .toEqual([
        [hiitCardio.id, hiitSessions[0].id],
        [hiitCardio.id, hiitSessions[0].id],
      ]);
  });
});

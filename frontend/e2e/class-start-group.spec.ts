// Acceptance test
// Traces to: L2-083 AC1, AC2; L2-085 AC1, AC2, AC3; L2-086 AC1, AC2
// Description: Class Start reads the class's next two group sessions and offers the next one: "7:39 PM · starts in 9
// min · 6 of 10 riders", chosen, with "Riding in this session" listing its riders and "Join · starts in 9 min", which
// opens the group ride with that session. Within a minute it reads "starts in 1 min" and "Join now · starting"; a full
// session offers the next one; and the sessions are read again every 30 seconds. Joining through the hub, and the
// session refusing a full or started join, are slice 14.3's.
import {
  hiitCardio,
  hiitSession,
  hiitSessions,
  type SessionRider,
  SESSIONS_NOW,
  sixRiders,
} from './fixtures/classes';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassStartPage } from './pages/class-start.page';

const SESSIONS = `/api/classes/${hiitCardio.id}/sessions`;

test.describe('Group sessions on Class Start', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: SESSIONS_NOW });
  });

  test('the next session is chosen with its riders, and Join opens the group ride with it (L2-085 AC1, AC2, AC3) @critical', async ({
    page,
    api,
    bluetooth,
    hub,
  }) => {
    api.answer('GET', SESSIONS, hiitSessions);
    await bluetooth.remember(echelonBike);
    const start = new ClassStartPage(page);
    await start.open(hiitCardio.id);

    await expect(start.group).toHaveAttribute('aria-checked', 'true');
    await expect(start.body(start.group)).toHaveText('7:39 PM · starts in 9 min · 6 of 10 riders');
    await expect(start.sessionLabel).toHaveText('Riding in this session');
    await expect(start.riders).toHaveAccessibleName('6 riders');
    await expect(start.riders.getByRole('listitem')).toHaveText(
      sixRiders.map((r) => r.displayName),
    );
    await expect(start.note).toHaveText(
      'Everyone rides the same video in sync. The board ranks riders by output, so heavier gears count.',
    );
    await expect(start.join).toHaveText('Join · starts in 9 min');

    await start.alone.click();
    await expect(start.start).toBeVisible();
    await expect(start.sessionLabel).toHaveCount(0);
    await start.group.click();

    hub.open();
    hub.answer('ServerTime', () => Date.now());
    await start.join.click();
    await expect(page).toHaveURL(`/classes/${hiitCardio.id}/ride?session=${hiitSessions[0].id}`);
  });

  test('a session starting within a minute reads "starts in 1 min" and "Join now · starting" (L2-086 AC1)', async ({
    page,
    api,
  }) => {
    api.answer('GET', SESSIONS, [
      hiitSession('2026-11-21T19:30:40Z', sixRiders),
      hiitSession('2026-11-21T19:45:40Z', []),
    ]);
    const start = new ClassStartPage(page);
    await start.open(hiitCardio.id);

    await expect(start.body(start.group)).toHaveText('7:30 PM · starts in 1 min · 6 of 10 riders');
    await expect(start.join).toHaveText('Join now · starting');
  });

  test('a full session offers the next one, 15 minutes later (L2-086 AC2)', async ({
    page,
    api,
  }) => {
    api.answer('GET', SESSIONS, [
      hiitSession('2026-11-21T19:39:00Z', sixRiders, true),
      hiitSession('2026-11-21T19:54:00Z', sixRiders.slice(0, 2)),
    ]);
    const start = new ClassStartPage(page);
    await start.open(hiitCardio.id);

    await expect(start.body(start.group)).toHaveText(
      'This session is full. Next one starts 15 minutes later.',
    );
    await expect(start.sessionLabel).toHaveText('Next session');
    await expect(start.next).toHaveText('7:54 PM · 2 of 10 riders so far');
    await expect(start.riders).toHaveCount(0);
    await expect(start.join).toHaveText('Join the next session');
  });

  test('the sessions are read again every 30 seconds, and the minutes count down (L2-083 AC2)', async ({
    page,
    api,
  }) => {
    let riders: readonly SessionRider[] = sixRiders.slice(0, 5);
    api.answer('GET', SESSIONS, () => ({
      status: 200,
      body: [hiitSession('2026-11-21T19:39:00Z', riders), hiitSession('2026-11-21T19:54:00Z', [])],
    }));
    const start = new ClassStartPage(page);
    await start.open(hiitCardio.id);
    await expect(start.body(start.group)).toHaveText('7:39 PM · starts in 9 min · 5 of 10 riders');

    riders = sixRiders;
    await page.clock.runFor(60_000);

    await expect(start.body(start.group)).toHaveText('7:39 PM · starts in 8 min · 6 of 10 riders');
    expect(api.requests().filter((r) => r === `GET ${SESSIONS}`).length).toBeGreaterThanOrEqual(3);
  });
});

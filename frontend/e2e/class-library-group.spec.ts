// Acceptance test
// Traces to: L2-083 AC2; L2-081 AC4, AC6
// Description: each open card of the Class Library reads its class's next group session, "Group in 9 min · 6/10", from
// the whole minutes to its start and the seats taken, and reads it again every 30 seconds. A locked card shows none,
// and with no sessions to read no card does (class-library.spec.ts).
import { SESSIONS_NOW } from './fixtures/classes';
import { library } from './fixtures/library';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';

function next(classId: string, startsAt: string, seatsTaken: number) {
  return { classId, sessionId: `${classId}@x`, startsAt, seatsTaken, capacity: 10 };
}

test.describe('Group chips in the Class Library', () => {
  test.beforeEach(async ({ page, api }) => {
    await page.clock.install({ time: SESSIONS_NOW });
    api.answer('GET', '/api/classes', library);
  });

  test('an open card reads its next group session, and a locked one none (L2-083 AC2) @critical', async ({
    page,
    api,
  }) => {
    api.answer('GET', '/api/classes/sessions', [
      next('power-intervals-20', '2026-11-21T19:36:00Z', 5),
      next('threshold-builder-20', '2026-11-21T19:32:00Z', 6),
      next('hiit-cardio-30', '2026-11-21T19:39:00Z', 6),
      next('tempo-paceline-30', '2026-11-21T19:39:00Z', 3),
    ]);
    const classes = new ClassLibraryPage(page);
    await classes.open();

    await expect(classes.card('20 Minute Power Intervals').group).toHaveText(
      'Group in 6 min · 5/10',
    );
    await expect(classes.card('20 Min Threshold Builder').group).toHaveText(
      'Group in 2 min · 6/10',
    );
    await expect(classes.card('30 Minute HIIT Cardio').group).toHaveText('Group in 9 min · 6/10');
    await expect(classes.card('30 Min Tempo Paceline').group).toHaveCount(0);
  });

  test('the chips are read again every 30 seconds, and the minutes count down (L2-083 AC2)', async ({
    page,
    api,
  }) => {
    let seats = 6;
    api.answer('GET', '/api/classes/sessions', () => ({
      status: 200,
      body: [next('hiit-cardio-30', '2026-11-21T19:39:00Z', seats)],
    }));
    const classes = new ClassLibraryPage(page);
    await classes.open();
    const hiit = classes.card('30 Minute HIIT Cardio');
    await expect(hiit.group).toHaveText('Group in 9 min · 6/10');

    seats = 7;
    await page.clock.runFor(60_000);

    await expect(hiit.group).toHaveText('Group in 8 min · 7/10');
  });
});

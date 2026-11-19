// Acceptance Test
// Traces to: L2-085
// Description: The Session Summary at /sessions/:id: the date line, title and average power, the
// change since the previous attempt, ended early, the personal bests, the streak with this week,
// the cadence and power traces with every dip, the dips as rows that highlight their band, the
// totals, and the loading, not-found and error states.
import { expect, test } from './fixtures/wz-test';
import { progressAfterRide, sessionDetail } from './fixtures/sessions';
import { SessionSummaryPage } from './pages/session-summary.page';

test.describe('Session Summary (L2-085)', () => {
  test('shows the date line, the title and the average power with the change since last time', async ({
    page,
    api,
    events,
  }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open();

    await expect(page).toHaveTitle('Your ride · Wattzup');
    await expect(summary.date).toHaveText('Wednesday 18 Nov at 18:10');
    await expect(summary.heading).toHaveText('30 Minute HIIT Cardio');
    await expect(summary.headline).toHaveText('156W');
    await expect(summary.change).toHaveText('+3 W');
    await expect(summary.since).toHaveText('vs last time, 17 Nov');
    await expect(summary.early).toHaveCount(0);
    await expect(summary.bests).toHaveText(['Best average on this class']);
  });

  test('opened directly, the back link reads All sessions and goes to Progress', async ({
    page,
    api,
    events,
  }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open();

    await expect(summary.back).toHaveText('All sessions');
    await expect(summary.back).toHaveAttribute('href', '/progress');
    await expect(summary.rideAgain).toHaveAttribute('href', '/classes/30-minute-hiit-cardio');
  });

  test('writes a fall with its minus sign and no change as 0 W', async ({ page, api, events }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open({ json: sessionDetail({ avg_power: 149 }) });
    await expect(summary.change).toHaveText('−4 W');

    await summary.answer(
      { json: sessionDetail({ avg_power: 153 }) },
      { json: progressAfterRide() },
    );
    await page.reload();
    await expect(summary.change).toHaveText('0 W');
  });

  test('a first ride from setup has no change, no Ride this again and no bests', async ({
    page,
    api,
    events,
  }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open({
      json: sessionDetail({
        class_id: null,
        title: 'Flat · Level 12 · 20 min',
        previous: null,
        bests: [],
      }),
    });

    await expect(summary.heading).toHaveText('Flat · Level 12 · 20 min');
    await expect(summary.change).toHaveCount(0);
    await expect(summary.since).toHaveCount(0);
    await expect(summary.rideAgain).toHaveCount(0);
    await expect(summary.bests).toHaveCount(0);
  });

  test('says Ended early with the ridden and planned times', async ({ page, api, events }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open({
      json: sessionDetail({ ridden_seconds: 1120, completed: false, dips: [] }),
    });

    await expect(summary.early).toHaveText('Ended early · 18:40 of 30:00');
  });

  test('shows every best the session set, in order', async ({ page, api, events }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open({
      json: sessionDetail({
        dips: [],
        bests: ['Best 1-minute power', 'Best average on this class', 'No cadence dips'],
      }),
    });

    await expect(summary.bests).toHaveText([
      'Best 1-minute power',
      'Best average on this class',
      'No cadence dips',
    ]);
  });

  test('shows the streak, the best and this week with each day named', async ({
    page,
    api,
    events,
  }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open();

    await expect(summary.streakCount).toHaveText('4days');
    await expect(summary.streakBest).toHaveText('6');
    await expect(summary.weekDays).toHaveCount(7);
    await expect(summary.weekDays.nth(0)).toHaveAttribute('aria-label', 'Monday 16 Nov, ridden');
    await expect(summary.weekDays.nth(2)).toHaveAttribute('aria-label', 'Wednesday 18 Nov, ridden');
    await expect(summary.weekDays.nth(3)).toHaveAttribute(
      'aria-label',
      'Thursday 19 Nov, not ridden',
    );
    await expect(summary.weekLine).toHaveText('3 of 4 rides this week. 1 more to hit your goal.');
  });

  test('says the weekly goal is hit from four rides, and day for a streak of one', async ({
    page,
    api,
    events,
  }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open(
      { json: sessionDetail() },
      {
        json: progressAfterRide({
          streak: { current: 1, best: 6, rode_today: true },
          week: { rides: 4, goal: 4 },
        }),
      },
    );

    await expect(summary.streakCount).toHaveText('1day');
    await expect(summary.weekLine).toHaveText('Weekly goal hit — 4 rides this week.');
  });

  test('describes the traces and marks every dip', async ({ page, api, events }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open();

    await expect(summary.traces).toHaveAttribute(
      'aria-label',
      'Cadence and power over the ride: average cadence 78 rpm, 3 dips; average power 156 W, peak 453 W',
    );
    await expect(summary.dipBands).toHaveCount(3);
  });

  test('lists the dips and highlights the one hovered or focused on the traces', async ({
    page,
    api,
    events,
  }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open();

    await expect(summary.onTarget).toHaveText('96% on target');
    await expect(summary.dipLead).toHaveText(
      '3 times, 0:42 in all, your legs fell under target. Last time: 1.',
    );
    await expect(summary.dipRows).toHaveCount(3);
    await expect(summary.dipRows.nth(0)).toHaveText(
      '11:37Work · round 3Down to 86 rpm for 15s · target 98−12',
    );
    await expect(summary.focusedBand).toHaveCount(0);

    await summary.dipRows.nth(1).hover();
    await expect(summary.focusedBand).toHaveCount(1);
    await expect(summary.focusedBand).toHaveAttribute('x', '1027');
    await page.mouse.move(0, 0);
    await expect(summary.focusedBand).toHaveCount(0);

    await summary.dipRows.nth(2).focus();
    await expect(summary.focusedBand).toHaveAttribute('x', '1418');
  });

  test('says there is nothing to fix when no dip was found', async ({ page, api, events }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open({ json: sessionDetail({ dips: [], on_target_pct: 100 }) });

    await expect(summary.onTarget).toHaveText('100% on target');
    await expect(summary.noDips).toHaveText(
      'Cadence held at target for the whole ride. Nothing to fix.',
    );
    await expect(summary.dipRows).toHaveCount(0);
  });

  test('shows the totals without heart rate', async ({ page, api, events }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open();

    await expect(summary.stats.locator('dt')).toHaveText([
      'Time',
      'Best 1 min',
      'Max power',
      'Avg cadence',
      'Distance',
      'Energy',
    ]);
    await expect(summary.stat('Time')).toHaveText('30:00');
    await expect(summary.stat('Best 1 min')).toHaveText('290 W');
    await expect(summary.stat('Distance')).toHaveText('12.8 km');
    await expect(summary.stat('Energy')).toHaveText('280 kcal');
  });

  test('shows skeletons while loading', async ({ page, api, events }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open({ hang: true });

    await expect(summary.skeletons.first()).toBeVisible();
    await expect(page.locator('.history')).toHaveAttribute('aria-busy', 'true');
  });

  test("says it can't find a ride the backend does not have", async ({ page, api, events }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open({ status: 404, json: { code: 'session_not_found' } });

    await expect(summary.noticeTitle).toHaveText("We can't find that ride");
    await expect(summary.noticeText).toHaveText(
      "It isn't in your saved sessions. Wattzup keeps the newest 500.",
    );
    await expect(summary.noticeAllSessions).toHaveAttribute('href', '/progress');
  });

  test('offers Try again when the server does not answer, and repeats both requests', async ({
    page,
    api,
    events,
  }) => {
    const summary = new SessionSummaryPage(page, api);
    await summary.open({ abort: true });

    await expect(summary.notice).toHaveAttribute('role', 'alert');
    await expect(summary.noticeTitle).toHaveText("Couldn't load this ride");
    await expect(summary.noticeText).toHaveText(
      "The Wattzup server didn't answer. Your ride is saved.",
    );

    summary.answer({ json: sessionDetail() }, { json: progressAfterRide() });
    await summary.tryAgain.click();
    await expect(summary.heading).toHaveText('30 Minute HIIT Cardio');
  });
});

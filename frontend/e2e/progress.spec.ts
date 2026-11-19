// Acceptance Test
// Traces to: L2-086
// Description: Progress at /progress: the ride button, the trend of a class ridden more than
// once by measure, the saved sessions, the streak calendar with this week and all time, the
// achievements, and the empty, loading and error states.
import { expect, test } from './fixtures/wz-test';
import { progressReport, sessionDetail, sessionSummary } from './fixtures/sessions';
import { ProgressPage } from './pages/progress.page';

test.describe('Progress (L2-086)', () => {
  test('heads the page with Progress and a button to keep the streak going', async ({
    page,
    api,
    events,
  }) => {
    const progress = new ProgressPage(page, api);
    await progress.open();

    await expect(page).toHaveTitle('Progress · Wattzup');
    await expect(progress.title).toHaveText('Progress');
    await expect(progress.ride).toHaveText('Ride to make it 4');
    await expect(progress.ride).toHaveAttribute('href', '/classes');
  });

  test('reads Ride again once the rider has ridden today', async ({ page, api, events }) => {
    const progress = new ProgressPage(page, api);
    await progress.open({
      json: progressReport({ streak: { current: 4, best: 6, rode_today: true } }),
    });

    await expect(progress.ride).toHaveText('Ride again');
    await expect(progress.streakMessage).toHaveText(
      "Today's done. See you tomorrow. 3 more days beats your best.",
    );
  });

  test('compares the classes ridden more than once, the latest selected', async ({
    page,
    api,
    events,
  }) => {
    const progress = new ProgressPage(page, api);
    await progress.open();

    await expect(progress.heading).toHaveText('Getting stronger');
    await expect(progress.lead).toHaveText(
      'Same class, same plan — the only thing that changed is you.',
    );
    await expect(progress.classes).toHaveText([
      '30 Minute HIIT Cardio5',
      '20 Minute Power Intervals2',
    ]);
    await expect(progress.classOption('30 Minute HIIT Cardio')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(progress.measures).toHaveText([
      'Average power',
      'Cadence on target',
      'Cadence dips',
    ]);
    await expect(progress.measure('Average power')).toHaveAttribute('aria-selected', 'true');
    await expect(progress.trend).toHaveAttribute(
      'aria-label',
      'Average power across 5 attempts at 30 Minute HIIT Cardio: from 145 W to 153 W',
    );
    await expect(progress.trendValue).toHaveText('153W');
    await expect(progress.trendChange).toHaveText('+8 W since your first ride on 3 Nov · 5 rides');
  });

  test('plots one link per attempt, oldest first, the latest larger', async ({
    page,
    api,
    events,
  }) => {
    const progress = new ProgressPage(page, api);
    await progress.open();

    await expect(progress.points).toHaveCount(5);
    await expect(progress.point('3 Nov: 145 W')).toHaveAttribute('href', '/sessions/a1c3e5f70911');
    await expect(progress.point('17 Nov: 153 W')).toHaveClass(/trend-chart__point--latest/);
    api.on('GET', '/api/sessions/d4f6b8ca3c44', { json: sessionDetail({ id: 'd4f6b8ca3c44' }) });
    await progress.point('9 Nov: 149 W').click();
    await expect(page).toHaveURL(/\/sessions\/d4f6b8ca3c44$/);
  });

  test('moves between classes and measures with the arrow keys', async ({ page, api, events }) => {
    const progress = new ProgressPage(page, api);
    await progress.open();

    await progress.classOption('30 Minute HIIT Cardio').focus();
    await page.keyboard.press('ArrowRight');
    await expect(progress.classOption('20 Minute Power Intervals')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(progress.classOption('20 Minute Power Intervals')).toBeFocused();
    await expect(progress.trendValue).toHaveText('205W');
    await expect(progress.trendChange).toHaveText('+7 W since your first ride on 5 Nov · 2 rides');

    await progress.measure('Average power').focus();
    await page.keyboard.press('ArrowRight');
    await expect(progress.measure('Cadence on target')).toHaveAttribute('aria-selected', 'true');
    await expect(progress.measure('Cadence on target')).toBeFocused();
    await expect(progress.trendValue).toHaveText('89%');
    await expect(progress.trendChange).toHaveText('+1% since your first ride on 5 Nov · 2 rides');
  });

  test('counts dips down as better', async ({ page, api, events }) => {
    const progress = new ProgressPage(page, api);
    await progress.open();

    await progress.measure('Cadence dips').click();
    await expect(progress.trendValue).toHaveText('1dip');
    await expect(progress.trendChange).toHaveText(
      '8 fewer since your first ride on 3 Nov · 5 rides',
    );
    await expect(progress.trend).toHaveAttribute(
      'aria-label',
      'Cadence dips across 5 attempts at 30 Minute HIIT Cardio: from 9 dips to 1 dip',
    );
    await expect(progress.point('3 Nov: 9 dips')).toBeVisible();
  });

  test('asks for a second ride of a class before showing a trend', async ({
    page,
    api,
    events,
  }) => {
    const progress = new ProgressPage(page, api);
    await progress.open({
      json: progressReport({
        classes: [
          {
            class_id: '30-minute-hiit-cardio',
            title: '30 Minute HIIT Cardio',
            attempts: [sessionSummary()],
          },
        ],
      }),
    });

    await expect(progress.noTrend).toHaveText('Ride a class twice to see a trend.');
    await expect(progress.compare).toHaveCount(0);
    await expect(progress.measures).toHaveCount(0);
    await expect(progress.trend).toHaveCount(0);
  });

  test('lists the newest 8 sessions as links and shows the rest on request', async ({
    page,
    api,
    events,
  }) => {
    const progress = new ProgressPage(page, api);
    await progress.open();

    await expect(progress.sessionsCount).toHaveText('11 saved');
    await expect(progress.rows).toHaveCount(8);
    await expect(progress.rows.nth(0)).toHaveAttribute('href', '/sessions/ebf2d4e1adbb');
    await expect(progress.rows.nth(0).locator('.session-list__date')).toHaveText('Tue 17 Nov');
    await expect(progress.rows.nth(1).locator('.session-list__name')).toHaveText(
      'HIIT · 8 × 0:30 / 1:30',
    );
    await expect(progress.rows.nth(1).locator('.session-list__early')).toHaveText('Ended early');
    await expect(progress.rows.nth(1).locator('.session-list__num')).toHaveText([
      '18:30',
      '168W',
      '97%',
      '1',
    ]);
    await expect(progress.more).toHaveText('Show all 11');

    await progress.more.click();
    await expect(progress.rows).toHaveCount(11);
    await expect(progress.more).toHaveText('Show fewer');
    await progress.more.click();
    await expect(progress.rows).toHaveCount(8);
  });

  test('shows the streak, six weeks of days, this week and all time', async ({
    page,
    api,
    events,
  }) => {
    const progress = new ProgressPage(page, api);
    await progress.open();

    await expect(progress.streakCount).toHaveText('3days');
    await expect(progress.streakBest).toHaveText('6');
    await expect(progress.streakMessage).toHaveText(
      'Ride today to keep it alive. 4 more days beats your best.',
    );
    await expect(progress.calendar).toHaveCount(42);
    await expect(progress.calendar.nth(0)).toHaveAttribute(
      'aria-label',
      'Monday 12 Oct, not ridden',
    );
    await expect(progress.calendar.nth(22)).toHaveAttribute('aria-label', 'Tuesday 3 Nov, ridden');
    await expect(progress.calendar.nth(37)).toHaveAttribute(
      'aria-label',
      'Wednesday 18 Nov, not ridden',
    );
    await expect(progress.weekRides).toHaveText('This week2 of 4 rides');
    await expect(progress.meter).toHaveAttribute('aria-valuenow', '2');
    await expect(progress.allTime).toHaveText('All time: 11 rides · 5 h · 133 km');
  });

  test('says one ride starts a new streak when there is none', async ({ page, api, events }) => {
    const progress = new ProgressPage(page, api);
    await progress.open({
      json: progressReport({ streak: { current: 0, best: 6, rode_today: false } }),
    });

    await expect(progress.streakCount).toHaveText('0days');
    await expect(progress.streakMessage).toHaveText('One ride starts a new streak.');
    await expect(progress.ride).toHaveText('Ride to make it 1');
  });

  test('shows the achievements, unlocked with a check and locked with how close', async ({
    page,
    api,
    events,
  }) => {
    const progress = new ProgressPage(page, api);
    await progress.open();

    await expect(progress.achievementsCount).toHaveText('4 of 6');
    await expect(progress.achievements.locator('.achievement__title')).toHaveText([
      'Century',
      'Interval regular',
      'Metronome',
      'Clean sheet',
      'Seven straight',
      'The long hour',
    ]);
    await expect(progress.achievement('Century').getByRole('img')).toHaveAttribute(
      'aria-label',
      'Unlocked',
    );
    const seven = progress.achievement('Seven straight');
    await expect(seven.getByRole('img')).toHaveText('86%');
    await expect(seven.locator('.achievement__value')).toHaveText('6 / 7 days');
    await expect(seven.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '6');
    await expect(progress.achievement('The long hour').locator('.achievement__value')).toHaveText(
      '1 / 5',
    );
  });

  test('says No rides yet with Find a class when nothing is saved', async ({
    page,
    api,
    events,
  }) => {
    const progress = new ProgressPage(page, api);
    await progress.open(
      {
        json: progressReport({
          streak: { current: 0, best: 0, rode_today: false },
          ride_days: [],
          week: { rides: 0, goal: 4 },
          totals: { rides: 0, ridden_seconds: 0, distance_km: 0 },
          classes: [],
        }),
      },
      { json: { sessions: [] } },
    );

    await expect(progress.noticeTitle).toHaveText('No rides yet');
    await expect(progress.noticeText).toHaveText(
      'Finish a class and it shows up here, with your streak and what changed since last time.',
    );
    await expect(progress.findClass).toHaveAttribute('href', '/classes');
    await expect(progress.rows).toHaveCount(0);
    await expect(progress.achievements).toHaveCount(0);
  });

  test('shows skeletons while loading', async ({ page, api, events }) => {
    const progress = new ProgressPage(page, api);
    await progress.open({ hang: true });

    await expect(progress.skeletons.first()).toBeVisible();
    await expect(page.locator('.history')).toHaveAttribute('aria-busy', 'true');
  });

  test('offers Try again when the server does not answer', async ({ page, api, events }) => {
    const progress = new ProgressPage(page, api);
    await progress.open({ abort: true });

    await expect(progress.notice).toHaveAttribute('role', 'alert');
    await expect(progress.noticeTitle).toHaveText("Couldn't load your progress");
    await expect(progress.noticeText).toHaveText(
      "The Wattzup server didn't answer. Your rides are saved.",
    );

    progress.answer({ json: progressReport() }, { json: { sessions: [] } });
    await progress.tryAgain.click();
    await expect(progress.heading).toHaveText('No rides yet');
  });
});

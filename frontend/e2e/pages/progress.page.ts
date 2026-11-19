import type { Locator, Page, Request } from '@playwright/test';
import type { ApiStub, StubResponse } from '../fixtures/wz-test';
import { progressReport, sessionList } from '../fixtures/sessions';

type Answer = StubResponse | ((request: Request) => StubResponse | Promise<StubResponse>);

/** Progress at `/progress` (L2-086). Owns every Progress selector. */
export class ProgressPage {
  readonly title: Locator;
  readonly ride: Locator;
  readonly heading: Locator;
  readonly lead: Locator;
  readonly noTrend: Locator;
  readonly compare: Locator;
  readonly classes: Locator;
  readonly measures: Locator;
  readonly trend: Locator;
  readonly trendValue: Locator;
  readonly trendChange: Locator;
  readonly points: Locator;
  readonly sessionsCount: Locator;
  readonly rows: Locator;
  readonly more: Locator;
  readonly streakCount: Locator;
  readonly streakBest: Locator;
  readonly streakMessage: Locator;
  readonly calendar: Locator;
  readonly weekRides: Locator;
  readonly meter: Locator;
  readonly allTime: Locator;
  readonly achievementsCount: Locator;
  readonly achievements: Locator;
  readonly skeletons: Locator;
  readonly notice: Locator;
  readonly noticeTitle: Locator;
  readonly noticeText: Locator;
  readonly tryAgain: Locator;
  readonly findClass: Locator;

  constructor(
    readonly page: Page,
    private readonly api: ApiStub,
  ) {
    const bar = page.locator('.app-bar');
    this.title = bar.locator('.app-bar__title');
    this.ride = bar.getByRole('link', { name: /^Ride / });
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.progress-head .lead');
    this.noTrend = page.locator('.progress-head__none');
    this.compare = page.getByRole('radiogroup', { name: 'Class to compare' });
    this.classes = this.compare.getByRole('radio');
    this.measures = page.getByRole('tablist', { name: 'Measure' }).getByRole('tab');
    this.trend = page.locator('section.trend-chart');
    this.trendValue = this.trend.locator('.trend-chart__value');
    this.trendChange = this.trend.locator('.trend-chart__change');
    this.points = this.trend.locator('a.trend-chart__point');
    this.sessionsCount = page.locator('.session-list__count');
    this.rows = page.locator('a.session-list__row');
    this.more = page.locator('.session-list__more');
    this.streakCount = page.locator('.streak-calendar__count');
    this.streakBest = page.locator('.streak-calendar__best-value');
    this.streakMessage = page.locator('.streak-calendar__message');
    this.calendar = page
      .getByRole('list', { name: 'This week and the five before it' })
      .locator('li');
    this.weekRides = page.locator('.streak-calendar__week-head');
    this.meter = page.getByRole('meter', { name: 'Rides this week' });
    this.allTime = page.locator('.streak-calendar__total');
    this.achievementsCount = page.locator('.achievement-list__count');
    this.achievements = page.locator('li.achievement');
    this.skeletons = page.locator('.history .skeleton');
    this.notice = page.locator('.history .empty');
    this.noticeTitle = this.notice.locator('.empty__title');
    this.noticeText = this.notice.locator('.empty__text');
    this.tryAgain = this.notice.getByRole('button', { name: 'Try again' });
    this.findClass = this.notice.getByRole('link', { name: 'Find a class' });
  }

  classOption(title: string): Locator {
    return this.compare.getByRole('radio', { name: new RegExp(`^${title}`) });
  }

  measure(name: string): Locator {
    return this.page.getByRole('tab', { name, exact: true });
  }

  point(name: string): Locator {
    return this.trend.getByRole('link', { name, exact: true });
  }

  achievement(title: string): Locator {
    return this.page.locator('li.achievement', {
      has: this.page.locator('.achievement__title', { hasText: title }),
    });
  }

  /** Answers GET /api/progress and GET /api/sessions, then loads the page. */
  async open(
    progress: Answer = { json: progressReport() },
    sessions: Answer = { json: sessionList() },
  ): Promise<void> {
    this.answer(progress, sessions);
    await this.page.goto('/progress');
  }

  answer(progress: Answer, sessions: Answer): void {
    this.api.on('GET', '/api/progress', progress);
    this.api.on('GET', '/api/sessions', sessions);
  }
}

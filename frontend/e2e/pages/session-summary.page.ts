import type { Locator, Page, Request } from '@playwright/test';
import type { ApiStub, StubResponse } from '../fixtures/wz-test';
import { SESSION_ID, progressAfterRide, sessionDetail } from '../fixtures/sessions';

type Answer = StubResponse | ((request: Request) => StubResponse | Promise<StubResponse>);

/** The Session Summary at `/sessions/:id` (L2-085). Owns every summary selector. */
export class SessionSummaryPage {
  readonly back: Locator;
  readonly rideAgain: Locator;
  readonly date: Locator;
  readonly heading: Locator;
  readonly headline: Locator;
  readonly change: Locator;
  readonly since: Locator;
  readonly early: Locator;
  readonly bests: Locator;
  readonly streakCount: Locator;
  readonly streakUnit: Locator;
  readonly streakBest: Locator;
  readonly weekDays: Locator;
  readonly weekLine: Locator;
  readonly traces: Locator;
  readonly dipBands: Locator;
  readonly focusedBand: Locator;
  readonly onTarget: Locator;
  readonly dipLead: Locator;
  readonly dipRows: Locator;
  readonly noDips: Locator;
  readonly stats: Locator;
  readonly skeletons: Locator;
  readonly notice: Locator;
  readonly noticeTitle: Locator;
  readonly noticeText: Locator;
  readonly tryAgain: Locator;
  readonly noticeAllSessions: Locator;

  constructor(
    readonly page: Page,
    private readonly api: ApiStub,
  ) {
    const bar = page.locator('.app-bar');
    this.back = bar.getByRole('link', { name: /^(Done|All sessions)$/ });
    this.rideAgain = bar.getByRole('link', { name: 'Ride this again' });
    this.date = page.locator('.session-head__date');
    this.heading = page.getByRole('heading', { level: 1 });
    this.headline = page.locator('.session-head__value');
    this.change = page.locator('.session-head__change');
    this.since = page.locator('.session-head__since');
    this.early = page.locator('.session-head__early');
    this.bests = page.getByRole('list', { name: 'Personal bests' }).getByRole('listitem');
    this.streakCount = page.locator('.streak-panel__count');
    this.streakUnit = page.locator('.streak-panel__unit');
    this.streakBest = page.locator('.streak-panel__best-value');
    this.weekDays = page.locator('.week-strip__bar');
    this.weekLine = page.locator('.streak-panel__week');
    this.traces = page.locator('section.session-traces');
    this.dipBands = page.locator('.session-traces__dip');
    this.focusedBand = page.locator('.session-traces__dip--focus');
    this.onTarget = page.locator('.dip-list__on-target');
    this.dipLead = page.locator('.dip-list__lead');
    this.dipRows = page.locator('button.dip-list__row');
    this.noDips = page.locator('.dip-list__empty');
    this.stats = page.locator('.stat-strip > div');
    this.skeletons = page.locator('.history .skeleton');
    this.notice = page.locator('.history .empty');
    this.noticeTitle = this.notice.locator('.empty__title');
    this.noticeText = this.notice.locator('.empty__text');
    this.tryAgain = this.notice.getByRole('button', { name: 'Try again' });
    this.noticeAllSessions = this.notice.getByRole('link', { name: 'All sessions' });
  }

  stat(label: string): Locator {
    return this.page
      .locator('.stat-strip > div', { has: this.page.locator('dt', { hasText: label }) })
      .locator('dd');
  }

  /** Answers GET /api/sessions/{id} and GET /api/progress, then loads the page. */
  async open(
    session: Answer = { json: sessionDetail() },
    progress: Answer = { json: progressAfterRide() },
    id = SESSION_ID,
  ): Promise<void> {
    this.answer(session, progress, id);
    await this.page.goto(`/sessions/${id}`);
  }

  answer(session: Answer, progress: Answer, id = SESSION_ID): void {
    this.api.on('GET', `/api/sessions/${id}`, session);
    this.api.on('GET', '/api/progress', progress);
  }
}

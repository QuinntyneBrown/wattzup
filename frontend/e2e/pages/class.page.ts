import type { Locator, Page, Request } from '@playwright/test';
import gcnClass from '../fixtures/recorded/class-30-minute-hiit-cardio.json';
import type { ApiStub, EventStreamStub, StubResponse } from '../fixtures/wz-test';
import { freeRide, type Json } from '../fixtures/states';

/** One row of the class page's Resistance group. */
export class LevelRowPart {
  readonly value: Locator;
  readonly lower: Locator;
  readonly raise: Locator;

  constructor(group: Locator, name: 'Work' | 'Recover' | 'Steady') {
    const row = group.locator('.level-row', { hasText: name });
    this.value = row.locator('.level-row__value');
    this.lower = row.getByRole('button', { name: `Lower ${name.toLowerCase()} resistance` });
    this.raise = row.getByRole('button', { name: `Raise ${name.toLowerCase()} resistance` });
  }
}

/** The class page at `/classes/:id` (L2-080). Owns every class page selector. */
export class ClassPage {
  readonly allClasses: Locator;
  readonly statusName: Locator;
  readonly chips: Locator;
  readonly heading: Locator;
  readonly description: Locator;
  readonly preview: Locator;
  readonly previewTitle: Locator;
  readonly previewMeta: Locator;
  readonly videoUrl: Locator;
  readonly videoError: Locator;
  readonly videoStart: Locator;
  readonly earlier: Locator;
  readonly later: Locator;
  readonly videoHelp: Locator;
  readonly plan: Locator;
  readonly total: Locator;
  readonly strip: Locator;
  readonly legend: Locator;
  readonly stretches: Locator;
  readonly resistance: Locator;
  readonly levelRows: Locator;
  readonly work: LevelRowPart;
  readonly recover: LevelRowPart;
  readonly steady: LevelRowPart;
  readonly resetButton: Locator;
  readonly startButton: Locator;
  readonly fullSetup: Locator;
  readonly alert: Locator;
  readonly tryAgain: Locator;
  readonly skeleton: Locator;
  readonly notFound: Locator;
  readonly notFoundTitle: Locator;
  readonly notFoundText: Locator;

  constructor(
    readonly page: Page,
    private readonly api: ApiStub,
    private readonly events: EventStreamStub,
  ) {
    this.allClasses = page.locator('.app-bar').getByRole('link', { name: 'All classes' });
    this.statusName = page.locator('.app-bar .statusline__name');
    this.chips = page.locator('.class-page__meta > *');
    this.heading = page.getByRole('heading', { level: 1 });
    this.description = page.locator('.class-page .lead');
    this.preview = page.locator('.class-page .video-frame');
    this.previewTitle = this.preview.locator('.video-frame__title');
    this.previewMeta = this.preview.locator('.video-frame__meta');
    this.videoUrl = page.getByLabel('YouTube link');
    this.videoError = page.locator('#video-url-error');
    this.videoStart = page.getByLabel('Ride starts at');
    this.earlier = page.getByRole('button', { name: 'Half a second earlier' });
    this.later = page.getByRole('button', { name: 'Half a second later' });
    this.videoHelp = page.locator('#video-help');
    this.plan = page.getByRole('complementary', { name: 'The plan' });
    this.total = this.plan.locator('.ride-total');
    this.strip = this.plan.locator('svg.profile');
    this.legend = this.plan.locator('.legend > li:not(.legend__aside)');
    this.stretches = this.plan.locator('.legend__aside');
    this.resistance = this.plan.getByRole('group', { name: 'Resistance' });
    this.levelRows = this.resistance.locator('.level-row');
    this.work = new LevelRowPart(this.resistance, 'Work');
    this.recover = new LevelRowPart(this.resistance, 'Recover');
    this.steady = new LevelRowPart(this.resistance, 'Steady');
    this.resetButton = this.plan.getByRole('button', { name: 'Reset to class' });
    this.startButton = this.plan.getByRole('button', { name: /^(Start ride|Starting…)$/ });
    this.fullSetup = this.plan.getByRole('link', { name: 'Change intervals in full setup' });
    this.alert = this.plan.getByRole('alert');
    this.tryAgain = this.plan.getByRole('button', { name: 'Try again' });
    this.skeleton = page.locator('.class-page .skeleton');
    this.notFound = page.locator('.library .empty');
    this.notFoundTitle = this.notFound.getByRole('heading', { level: 1 });
    this.notFoundText = this.notFound.locator('.empty__text');
  }

  /** A `<dt>` row of the plan card by its term. */
  figure(term: string): Locator {
    return this.plan.locator(`dt:text-is("${term}") + dd`);
  }

  /** Loads `/classes/<id>` with `answer` as GET /api/classes/<id> and `live` as the state. */
  async open(
    id = '30-minute-hiit-cardio',
    answer: StubResponse | ((request: Request) => StubResponse | Promise<StubResponse>) = {
      json: gcnClass,
    },
    live: Json = freeRide(),
  ): Promise<void> {
    this.api.on('GET', `/api/classes/${id}`, answer);
    this.api.on('GET', '/api/status', { json: live });
    await this.page.goto(`/classes/${id}`);
    await this.events.push(live);
  }
}

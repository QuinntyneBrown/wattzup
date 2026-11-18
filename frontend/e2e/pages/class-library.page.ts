import type { Locator, Page } from '@playwright/test';
import recordedClasses from '../fixtures/recorded/classes.json';
import type { Request } from '@playwright/test';
import type { ApiStub, EventStreamStub, StubResponse } from '../fixtures/wz-test';
import { freeRide, type Json } from '../fixtures/states';

/** One class card on the library page. */
export class ClassCardPart {
  readonly link: Locator;
  readonly cover: Locator;
  readonly thumbnail: Locator;
  readonly poster: Locator;
  readonly length: Locator;
  readonly strip: Locator;
  readonly title: Locator;
  readonly meta: Locator;
  readonly note: Locator;

  constructor(root: Locator) {
    this.link = root;
    this.cover = root.locator('.class-card__cover');
    this.thumbnail = this.cover.locator('img');
    this.poster = root.locator('.class-card__poster');
    this.length = root.locator('.class-card__length');
    this.strip = root.getByRole('img');
    this.title = root.getByRole('heading', { level: 3 });
    this.meta = root.locator('.class-card__meta');
    this.note = root.locator('.class-card__note');
  }
}

/** One shelf: a section labelled by its title. */
export class ShelfPart {
  readonly heading: Locator;
  readonly tagline: Locator;
  readonly count: Locator;
  readonly cards: Locator;

  constructor(readonly root: Locator) {
    this.heading = root.getByRole('heading', { level: 2 });
    this.tagline = root.locator('.shelf__blurb');
    this.count = root.locator('.shelf__count');
    this.cards = root.locator('a.class-card');
  }
}

/** The class library at `/classes` (L2-079). Owns every library selector. */
export class ClassLibraryPage {
  readonly heading: Locator;
  readonly lead: Locator;
  readonly statusName: Locator;
  readonly statusState: Locator;
  readonly buildYourOwn: Locator;
  readonly tabs: Locator;
  readonly shelves: Locator;
  readonly cards: Locator;
  readonly skeletons: Locator;
  readonly notice: Locator;
  readonly noticeTitle: Locator;
  readonly noticeText: Locator;
  readonly tryAgain: Locator;
  readonly noticeBuildYourOwn: Locator;

  /** The live state the page was opened with. */
  live: Json = freeRide();

  constructor(
    readonly page: Page,
    private readonly api: ApiStub,
    private readonly events: EventStreamStub,
  ) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.library__head .lead');
    this.statusName = page.locator('.app-bar .statusline__name');
    this.statusState = page.locator('.app-bar .statusline__state');
    this.buildYourOwn = page.locator('.app-bar').getByRole('link', { name: 'Build your own ride' });
    this.tabs = page.getByRole('tablist', { name: 'Ride length' }).getByRole('tab');
    this.shelves = page.locator('section.shelf');
    this.cards = page.locator('a.class-card');
    this.skeletons = page.locator('.shelf .skeleton');
    this.notice = page.locator('.library .empty');
    this.noticeTitle = this.notice.locator('.empty__title');
    this.noticeText = this.notice.locator('.empty__text');
    this.tryAgain = this.notice.getByRole('button', { name: 'Try again' });
    this.noticeBuildYourOwn = this.notice.getByRole('link', { name: 'Build your own ride' });
  }

  tab(name: string): Locator {
    return this.page.getByRole('tab', { name, exact: true });
  }

  shelf(title: string): ShelfPart {
    return new ShelfPart(
      this.page.locator('section.shelf', {
        has: this.page.getByRole('heading', { name: title, exact: true }),
      }),
    );
  }

  card(title: string): ClassCardPart {
    return new ClassCardPart(
      this.page.locator('a.class-card', {
        has: this.page.getByRole('heading', { name: title, exact: true }),
      }),
    );
  }

  /** Loads `/classes` with `catalogue` as the answer of GET /api/classes and `live` as the state. */
  async open(
    catalogue: StubResponse | ((request: Request) => StubResponse | Promise<StubResponse>) = {
      json: recordedClasses,
    },
    live: Json = freeRide(),
  ): Promise<void> {
    this.live = live;
    this.api.on('GET', '/api/classes', catalogue);
    this.api.on('GET', '/api/status', { json: live });
    await this.page.goto('/classes');
    await this.events.push(live);
  }
}

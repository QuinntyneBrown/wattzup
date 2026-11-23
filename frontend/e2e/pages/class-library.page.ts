import type { Locator, Page } from '@playwright/test';
import { AppHeader } from './app-header';

/** The Class Library at `/classes` (docs/mocks/pages/class-library/). */
export class ClassLibraryPage {
  readonly header: AppHeader;
  readonly heading: Locator;
  readonly lead: Locator;
  readonly tabList: Locator;
  readonly shelfTitles: Locator;
  readonly shelfBlurbs: Locator;
  readonly cards: Locator;
  readonly cardTitles: Locator;
  readonly error: Locator;
  readonly retry: Locator;

  constructor(private readonly page: Page) {
    this.header = new AppHeader(page);
    this.heading = page.getByRole('heading', { level: 1, name: 'Classes' });
    this.lead = page.locator('.library-head__lead');
    this.tabList = page.getByRole('tablist', { name: 'Class length' });
    this.shelfTitles = page.locator('.class-shelf__title');
    this.shelfBlurbs = page.locator('.class-shelf__blurb');
    this.cards = page.locator('.class-card');
    this.cardTitles = page.locator('.class-card__title');
    this.error = page.locator('.library-error .inline-message__text');
    this.retry = page.getByRole('button', { name: 'Try again' });
  }

  async open(): Promise<void> {
    await this.page.goto('/classes');
  }

  /** A length tab: All, 20 min, 30 min or 60 min. */
  tab(name: string): Locator {
    return this.tabList.getByRole('tab', { name, exact: true });
  }

  /** The card of the class with this title. */
  card(title: string): ClassCard {
    return new ClassCard(
      this.cards.filter({ has: this.page.locator('.class-card__title', { hasText: title }) }),
    );
  }
}

/** One class card: open, a link to its Class Start; locked, a disabled button. */
export class ClassCard {
  readonly cover: Locator;
  readonly time: Locator;
  readonly group: Locator;
  readonly lock: Locator;
  readonly profileBars: Locator;
  readonly meta: Locator;

  constructor(readonly root: Locator) {
    this.cover = root.locator('.class-card__cover img');
    this.time = root.locator('.class-card__time');
    this.group = root.locator('.class-card__group');
    this.lock = root.locator('.class-card__lock-label');
    this.profileBars = root.locator('.class-profile rect');
    this.meta = root.locator('.class-card__meta');
  }
}

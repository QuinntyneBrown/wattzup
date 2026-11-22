import type { Locator, Page } from '@playwright/test';
import { AppHeader } from './app-header';

/** Map Select at `/race` (docs/mocks/pages/map-select/). */
export class MapSelectPage {
  readonly header: AppHeader;
  readonly heading: Locator;
  readonly lead: Locator;
  readonly path: Locator;
  readonly rows: Locator;
  readonly names: Locator;
  readonly aside: Locator;
  readonly starRules: Locator;
  readonly asideNote: Locator;
  readonly error: Locator;
  readonly retry: Locator;

  constructor(private readonly page: Page) {
    this.header = new AppHeader(page);
    this.heading = page.getByRole('heading', { level: 1, name: 'Maps' });
    this.lead = page.locator('.maps__lead');
    this.path = page.locator('.map-path');
    this.rows = page.locator('.map-row');
    this.names = page.locator('.map-row__name');
    this.aside = page.getByRole('complementary', { name: 'Stars on every map' });
    this.starRules = page.locator('.star-rules__item');
    this.asideNote = page.locator('.maps-aside__note');
    this.error = page.locator('.maps-error .inline-message__text');
    this.retry = page.getByRole('button', { name: 'Try again' });
  }

  async open(): Promise<void> {
    await this.page.goto('/race');
  }

  /** The row of the map with this name. */
  row(name: string): MapRow {
    return new MapRow(
      this.rows.filter({ has: this.page.locator('.map-row__name', { hasText: name }) }),
    );
  }
}

/** One map's row: a link when the map is open, a disabled button when it is locked. */
export class MapRow {
  readonly name: Locator;
  readonly thumbnail: Locator;
  readonly facts: Locator;
  readonly stars: Locator;
  readonly best: Locator;
  readonly goal: Locator;
  readonly lock: Locator;

  constructor(readonly root: Locator) {
    this.name = root.locator('.map-row__name');
    this.thumbnail = root.locator('.map-row__thumb img');
    this.facts = root.locator('.map-row__facts');
    this.stars = root.getByRole('img', { name: /of 3 stars/ });
    this.best = root.locator('.map-row__best');
    this.goal = root.locator('.map-row__goal-text');
    this.lock = root.locator('.map-row__lock');
  }

  /** Whether the map's cover has been drawn from its file, not left broken. */
  thumbnailDrawn(): Promise<boolean> {
    return this.thumbnail.evaluate(
      (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
    );
  }
}

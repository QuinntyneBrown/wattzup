import type { Locator, Page } from '@playwright/test';

/** Connect Bike at `/connect` (docs/mocks/pages/connect-bike/). */
export class ConnectBikePage {
  readonly title: Locator;
  readonly deviceName: Locator;
  readonly deviceIdentifier: Locator;
  readonly pairButton: Locator;
  readonly searching: Locator;
  readonly pairedCheck: Locator;
  readonly worksWith: Locator;
  readonly worksWithBikes: Locator;
  readonly worksWithStatuses: Locator;
  readonly hint: Locator;
  /** The device card with the pair button under it. */
  readonly pairArea: Locator;
  readonly blocker: Locator;
  readonly blockerTitle: Locator;
  readonly blockerBody: Locator;
  readonly blockerAction: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByRole('heading', { level: 1 });
    this.deviceName = page.locator('.connect-device__name');
    this.deviceIdentifier = page.locator('.connect-device__signal');
    this.pairButton = page.locator('.connect__pair-btn');
    this.searching = page.locator('.connect-device__searching');
    this.pairedCheck = page.getByLabel('Paired', { exact: true });
    this.worksWith = page.getByRole('region', { name: 'Works with' });
    this.worksWithBikes = page.locator('.connect-works__item > :first-child');
    this.worksWithStatuses = page.locator('.connect-works__status');
    this.hint = page.locator('.connect__hint');
    this.pairArea = page.locator('.connect__pair');
    this.blocker = page.getByRole('alert');
    this.blockerTitle = page.locator('.connect-blocker__title');
    this.blockerBody = page.locator('.connect-blocker__body');
    this.blockerAction = page.locator('.connect-blocker__retry');
  }

  /** Opens Connect Bike; `simulate` adds `?simulate`, which only a development build honours. */
  async open(options: { simulate?: boolean } = {}): Promise<void> {
    await this.page.goto(options.simulate ? '/connect?simulate' : '/connect');
  }

  /** The top of each "Works with" row, in order: equal tops share a line. */
  async worksWithRowTops(): Promise<number[]> {
    const boxes = await this.page
      .locator('.connect-works__item')
      .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top));
    return boxes.map(Math.round);
  }

  async pair(): Promise<void> {
    await this.pairButton.click();
  }
}

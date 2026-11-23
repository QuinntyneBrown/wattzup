import type { Locator, Page } from '@playwright/test';

/**
 * The Diagnostics dialog (docs/mocks/dialogs/diagnostics/): the facts read in the browser, each a term and its value,
 * the privacy note and "Close diagnostics" (L2-113).
 */
export class DiagnosticsDialog {
  readonly root: Locator;
  /** The panel itself, for a close-up. */
  readonly panel: Locator;
  readonly heading: Locator;
  readonly close: Locator;
  readonly privacy: Locator;
  readonly terms: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog', { name: 'Diagnostics' });
    this.panel = this.root.locator('.diagnostics');
    this.heading = this.root.getByRole('heading', { name: 'Diagnostics' });
    this.close = this.root.getByRole('button', { name: 'Close diagnostics' });
    this.privacy = this.root.locator('.diagnostics__privacy');
    this.terms = this.root.locator('.diagnostics__facts dt');
  }

  /** The value beside `term`, as the facts list pairs them. */
  fact(term: string): Locator {
    return this.root
      .locator('.diagnostics__facts dt')
      .getByText(term, { exact: true })
      .locator('xpath=following-sibling::dd[1]');
  }
}

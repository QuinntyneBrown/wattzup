import type { Locator, Page } from '@playwright/test';
import { AppHeader } from './app-header';

/** Page not found (L2-145): any address that matches no screen. */
export class NotFoundPage {
  readonly header: AppHeader;
  readonly heading: Locator;
  readonly lead: Locator;
  readonly backHome: Locator;

  constructor(private readonly page: Page) {
    this.header = new AppHeader(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.not-found .page__lead');
    this.backHome = page.getByRole('link', { name: 'Back to Home' });
  }

  async open(path: string): Promise<void> {
    await this.page.goto(path);
  }
}

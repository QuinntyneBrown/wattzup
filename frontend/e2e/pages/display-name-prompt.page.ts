import type { Locator, Page } from '@playwright/test';

/** The display name prompt at `/sign-in/name` (L2-005 AC1, docs/mocks/pages/sign-in-name/). */
export class DisplayNamePromptPage {
  readonly heading: Locator;
  readonly name: Locator;
  readonly hint: Locator;
  readonly error: Locator;
  readonly message: Locator;
  readonly continue: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.name = page.getByRole('textbox', { name: 'Display name' });
    this.hint = page.locator('.display-name-form .field__hint');
    this.error = page.locator('.display-name-form .field__error');
    this.message = page.locator('.display-name-form__message');
    this.continue = page.getByRole('button', { name: 'Continue' });
  }

  async open(returnUrl?: string): Promise<void> {
    await this.page.goto(
      returnUrl ? `/sign-in/name?returnUrl=${encodeURIComponent(returnUrl)}` : '/sign-in/name',
    );
  }

  url(): string {
    return new URL(this.page.url()).pathname;
  }
}

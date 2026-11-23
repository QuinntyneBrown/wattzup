import type { Locator, Page } from '@playwright/test';

/** Sign in (L2-001, docs/mocks/pages/sign-in/): one email field and "Send my code". */
export class SignInPage {
  readonly heading: Locator;
  readonly email: Locator;
  readonly emailError: Locator;
  readonly send: Locator;
  readonly message: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.email = page.getByRole('textbox', { name: 'Email' });
    this.emailError = page.locator('.sign-in .field__error');
    this.send = page.locator('.sign-in__form button[type="submit"]');
    this.message = page.locator('.sign-in__message');
  }

  async open(): Promise<void> {
    await this.page.goto('/sign-in');
  }

  /** Types `email` and chooses "Send my code". */
  async ask(email: string): Promise<void> {
    await this.email.fill(email);
    await this.send.click();
  }

  url(): string {
    return new URL(this.page.url()).pathname;
  }
}

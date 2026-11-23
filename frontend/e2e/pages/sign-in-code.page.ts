import type { Locator, Page } from '@playwright/test';

/** The code screen (L2-002, docs/mocks/pages/sign-in-code/): names the email and offers "Send a new code". */
export class SignInCodePage {
  readonly heading: Locator;
  readonly lead: Locator;
  readonly email: Locator;
  readonly resend: Locator;
  readonly message: Locator;
  readonly changeEmail: Locator;
  readonly code: Locator;
  readonly codeError: Locator;
  readonly cells: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.sign-in__lead');
    this.email = page.locator('.sign-in__email');
    this.resend = page.locator('.sign-in__resend');
    this.message = page.locator('.sign-in__message');
    this.changeEmail = page.getByRole('button', { name: 'Use a different email' });
    this.code = page.getByRole('textbox', { name: 'Six-digit code' });
    this.codeError = page.locator('.code-entry__error');
    this.cells = page.locator('.code-entry__cell');
  }

  async open(): Promise<void> {
    await this.page.goto('/sign-in/code');
  }

  url(): string {
    return new URL(this.page.url()).pathname;
  }
}

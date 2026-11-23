import type { Locator, Page } from '@playwright/test';

/** The Display name dialog opened from Profile's Settings (L2-005 AC3, docs/mocks/dialogs/display-name/). */
export class DisplayNameDialog {
  readonly root: Locator;
  readonly title: Locator;
  readonly name: Locator;
  readonly error: Locator;
  readonly message: Locator;
  readonly save: Locator;
  readonly cancel: Locator;
  readonly close: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog', { name: 'Display name' });
    this.title = this.root.locator('.dialog__title');
    this.name = this.root.getByRole('textbox', { name: 'Display name' });
    this.error = this.root.locator('.field__error');
    this.message = this.root.locator('.display-name-form__message');
    this.save = this.root.getByRole('button', { name: 'Save' });
    this.cancel = this.root.getByRole('button', { name: 'Cancel' });
    this.close = this.root.getByRole('button', { name: 'Close' });
  }
}

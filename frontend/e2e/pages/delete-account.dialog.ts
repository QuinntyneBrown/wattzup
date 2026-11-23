import type { Locator, Page } from '@playwright/test';

/** The Delete my account dialog opened from Profile's Settings (L2-006 AC2, docs/mocks/dialogs/delete-account/). */
export class DeleteAccountDialog {
  readonly root: Locator;
  readonly lead: Locator;
  readonly confirmation: Locator;
  readonly message: Locator;
  readonly delete: Locator;
  readonly cancel: Locator;
  readonly close: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog', { name: 'Delete your account?' });
    this.lead = this.root.locator('#delete-account-lead');
    this.confirmation = this.root.getByRole('textbox', { name: 'Type “delete” to confirm' });
    this.message = this.root.getByRole('alert');
    this.delete = this.root.getByRole('button', { name: /^(Delete my account|Deleting…)$/ });
    this.cancel = this.root.getByRole('button', { name: 'Cancel' });
    this.close = this.root.getByRole('button', { name: 'Close' });
  }
}

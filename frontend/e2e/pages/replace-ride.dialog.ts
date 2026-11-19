import type { Locator, Page } from '@playwright/test';

/** The Replace the ride in progress? dialog (L2-052). */
export class ReplaceRideDialog {
  readonly dialog: Locator;
  readonly description: Locator;
  readonly error: Locator;
  readonly keepButton: Locator;
  readonly replaceButton: Locator;
  readonly startingButton: Locator;
  readonly tryAgainButton: Locator;
  readonly closeButton: Locator;

  constructor(readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Replace the ride in progress?' });
    this.description = this.dialog.locator('.dialog__desc');
    this.error = this.dialog.locator('.alert');
    this.keepButton = this.dialog.getByRole('button', { name: 'Keep current ride' });
    this.replaceButton = this.dialog.getByRole('button', { name: 'Replace ride' });
    this.startingButton = this.dialog.getByRole('button', { name: 'Starting…' });
    this.tryAgainButton = this.dialog.getByRole('button', { name: 'Try again' });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' });
  }
}

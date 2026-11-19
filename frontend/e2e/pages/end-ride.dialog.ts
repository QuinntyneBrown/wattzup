import type { Locator, Page } from '@playwright/test';

/** The End this ride? dialog (L2-051). */
export class EndRideDialog {
  readonly dialog: Locator;
  readonly description: Locator;
  readonly note: Locator;
  readonly error: Locator;
  readonly keepRidingButton: Locator;
  readonly endRideButton: Locator;
  readonly endingButton: Locator;
  readonly tryAgainButton: Locator;
  readonly closeButton: Locator;

  constructor(readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'End this ride?' });
    this.description = this.dialog.locator('.dialog__desc');
    this.note = this.dialog.locator('.dialog__body p');
    this.error = this.dialog.locator('.alert');
    this.keepRidingButton = this.dialog.getByRole('button', { name: 'Keep riding' });
    this.endRideButton = this.dialog.getByRole('button', { name: 'End ride' });
    this.endingButton = this.dialog.getByRole('button', { name: 'Ending…' });
    this.tryAgainButton = this.dialog.getByRole('button', { name: 'Try again' });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' });
  }
}

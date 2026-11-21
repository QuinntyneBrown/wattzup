import type { Locator, Page } from '@playwright/test';

/** The Ride sound dialog (L2-129). */
export class RideSoundDialog {
  readonly dialog: Locator;
  readonly soundSwitch: Locator;
  readonly doneButton: Locator;

  constructor(readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Ride sound' });
    this.soundSwitch = this.dialog.getByRole('switch', { name: 'Ride sound' });
    this.doneButton = this.dialog.getByRole('button', { name: 'Done' });
  }
}

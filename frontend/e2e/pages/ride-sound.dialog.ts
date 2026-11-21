import type { Locator, Page } from '@playwright/test';

/** The Ride sound dialog (L2-129). */
export class RideSoundDialog {
  readonly dialog: Locator;
  readonly soundSwitch: Locator;
  readonly volumeSlider: Locator;
  readonly volumeValue: Locator;
  readonly mutedNotice: Locator;
  readonly doneButton: Locator;

  constructor(readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Ride sound' });
    this.soundSwitch = this.dialog.getByRole('switch', { name: 'Ride sound' });
    this.volumeSlider = this.dialog.getByRole('slider', { name: 'Volume' });
    this.volumeValue = this.dialog.locator('output');
    this.mutedNotice = this.dialog
      .getByRole('status')
      .filter({ hasText: 'Muted while the video plays' });
    this.doneButton = this.dialog.getByRole('button', { name: 'Done' });
  }
}

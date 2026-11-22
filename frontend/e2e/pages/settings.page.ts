import type { Locator, Page } from '@playwright/test';
import { AppHeader } from './app-header';

/** Settings at `/settings` (docs/mocks/pages/settings/): its sections, their nav, the controls and the reset. */
export class SettingsPage {
  readonly header: AppHeader;
  readonly back: Locator;
  readonly heading: Locator;
  readonly lead: Locator;
  /** "Settings sections": a link to each section. */
  readonly sectionNav: Locator;
  /** Every section landmark, in order, each named by its heading. */
  readonly sections: Locator;
  /** The warning shown when the browser refuses to keep the settings (L2-158 AC7). */
  readonly notStored: Locator;
  /** Motion and display's "Keep the screen awake" switch (L2-164 AC5). */
  readonly keepAwake: Locator;
  /** The Bike section's row: the bike and its state, or "No bike yet" (L2-112 AC1, AC2). */
  readonly bikeRow: Locator;
  readonly resetText: Locator;
  readonly reset: Locator;
  /** What a screen reader hears after a change it cannot see, such as the reset (L2-158 AC6). */
  readonly announcement: Locator;

  constructor(private readonly page: Page) {
    this.header = new AppHeader(page);
    this.back = page.locator('.settings-page__head .back-link');
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.settings-page__lead');
    this.sectionNav = page.getByRole('navigation', { name: 'Settings sections' });
    this.sections = page.locator('main').getByRole('region');
    this.notStored = page.locator('.settings-page__notice').getByRole('alert');
    this.keepAwake = page.getByRole('switch', { name: 'Keep the screen awake' });
    this.bikeRow = this.section('Bike').getByRole('link');
    this.resetText = page.locator('.settings-reset__text');
    this.reset = page.getByRole('button', { name: 'Reset to recommended' });
    this.announcement = page.locator('.cdk-live-announcer-element');
  }

  /** A section landmark by its heading. */
  section(name: string): Locator {
    return this.page.locator('main').getByRole('region', { name, exact: true });
  }

  /** A section's link in "Settings sections". */
  navLink(name: string): Locator {
    return this.sectionNav.getByRole('link', { name, exact: true });
  }

  async open(fragment = ''): Promise<void> {
    await this.page.goto(`/settings${fragment ? `#${fragment}` : ''}`);
  }
}

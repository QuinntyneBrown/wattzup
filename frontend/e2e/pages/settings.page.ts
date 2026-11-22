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
    const world = this.section('World');
    this.graphicsApi = world.locator('.settings-section__head .pill');
    this.noWorlds = world.getByRole('status');
    this.qualities = world.getByRole('group', { name: 'Quality' }).getByRole('radio');
    this.stepDown = world.getByRole('switch', { name: 'Step down when frames drop' });
    this.stepDownText = world.locator('#step-down-desc');
    this.frameRate = world.getByRole('radiogroup', { name: 'Frame rate' });
    this.resolution = world.getByRole('slider', { name: 'Resolution' });
    this.resolutionValue = world.locator('.setting__value');
    this.graphics = world.getByRole('combobox', { name: 'Graphics' });
    this.graphicsHint = world.locator('#graphics-hint');
  }

  /** The World section's tag: the graphics API in use, or "Panorama only" (L2-159 AC1). */
  readonly graphicsApi: Locator;
  /** The World section's notice when the browser can't draw 3D (L2-161 AC4). */
  readonly noWorlds: Locator;
  /** The five Quality cards, in order, each a radio (L2-159 AC2). */
  readonly qualities: Locator;
  readonly stepDown: Locator;
  readonly stepDownText: Locator;
  readonly frameRate: Locator;
  readonly resolution: Locator;
  readonly resolutionValue: Locator;
  readonly graphics: Locator;
  readonly graphicsHint: Locator;

  /** A section landmark by its heading. */
  section(name: string): Locator {
    return this.page.locator('main').getByRole('region', { name, exact: true });
  }

  /** A Quality card by its level ("Auto", "Ultra", "High", "Medium", "Low"). */
  quality(level: string): Locator {
    return this.section('World').locator(`input[name="quality"][value="${level.toLowerCase()}"]`);
  }

  /** A section's link in "Settings sections". */
  navLink(name: string): Locator {
    return this.sectionNav.getByRole('link', { name, exact: true });
  }

  async open(fragment = ''): Promise<void> {
    await this.page.goto(`/settings${fragment ? `#${fragment}` : ''}`);
  }
}

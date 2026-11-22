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
    this.announcement = page.locator('.settings-page__announcement');
    const world = this.section('World');
    this.graphicsApi = world.locator('.settings-section__head .pill');
    this.noWorlds = world.locator('.settings-section__notice').getByRole('status');
    this.qualities = world.getByRole('group', { name: 'Quality' }).getByRole('radio');
    this.stepDown = world.getByRole('switch', { name: 'Step down when frames drop' });
    this.stepDownText = world.locator('#step-down-desc');
    this.frameRate = world.getByRole('radiogroup', { name: 'Frame rate' });
    this.resolution = world.getByRole('slider', { name: 'Resolution' });
    this.resolutionValue = world.locator('.setting__value');
    this.graphics = world.getByRole('combobox', { name: 'Graphics' });
    this.graphicsHint = world.locator('#graphics-hint');
    this.checkHint = world.locator('#check-hint');
    this.check = world.getByRole('button', { name: 'Check this device' });
    this.checkProgress = world.getByRole('progressbar', { name: 'Checking this device' });
    this.checkLabel = world.locator('.device-check .progress__label');
    this.checkPercent = world.locator('.device-check .progress__value');
    this.checkFoot = world.locator('.device-check .progress__foot');
    this.stopCheck = world.getByRole('button', { name: 'Stop the check' });
    this.checkResult = world.locator('.device-check__result');
    this.checkAgain = world.getByRole('button', { name: 'Check again' });
    const sound = this.section('Sound');
    this.soundText = sound.locator('.settings-section__desc');
    this.rideSound = sound.getByRole('switch', { name: 'Ride sound', exact: true });
    this.rideSoundText = sound.locator('#ride-sound-desc');
    this.volume = sound.getByRole('slider', { name: 'Ride sound volume' });
    this.volumeValue = sound.locator('.sound-settings__value');
    this.volumeScale = sound.locator('.sound-settings__scale');
    this.volumeHint = sound.locator('#ride-volume-hint');
    this.worldMusic = sound.getByRole('switch', { name: 'World music' });
    this.worldMusicText = sound.locator('#world-music-desc');
    this.muteUnderVideo = sound.getByRole('switch', {
      name: 'Mute ride sound under a class video',
    });
    this.muteUnderVideoText = sound.locator('#duck-desc');
    const display = this.section('Motion and display');
    this.displayText = display.locator('.settings-section__desc');
    this.reduceMotion = display.getByRole('radiogroup', { name: 'Reduce motion' });
    this.reduceMotionHint = display.locator('#motion-hint');
    this.theme = display.getByRole('radiogroup', { name: 'Theme' });
    this.themeHint = display.locator('#theme-hint');
    this.rideNumbers = display.getByRole('radiogroup', { name: 'Ride numbers' });
    this.rideNumbersHint = display.locator('#readouts-hint');
    this.keepAwakeText = display.locator('#wake-desc');
    this.fullScreenOnStart = display.getByRole('switch', {
      name: 'Go full screen when a ride starts',
    });
    this.fullScreenOnStartText = display.locator('#auto-full-desc');
  }

  /** Sound's line and its four controls, each with its words (L2-163 AC1). */
  readonly soundText: Locator;
  readonly rideSound: Locator;
  readonly rideSoundText: Locator;
  readonly volume: Locator;
  /** The volume as it reads beside its label, "70 %". */
  readonly volumeValue: Locator;
  /** "Quiet" and "Loud" under the slider. */
  readonly volumeScale: Locator;
  readonly volumeHint: Locator;
  readonly worldMusic: Locator;
  readonly worldMusicText: Locator;
  readonly muteUnderVideo: Locator;
  readonly muteUnderVideoText: Locator;
  /** Motion and display's line and its choices, each with its words (L2-164 AC1 to AC4, AC6). */
  readonly displayText: Locator;
  readonly reduceMotion: Locator;
  readonly reduceMotionHint: Locator;
  readonly theme: Locator;
  readonly themeHint: Locator;
  readonly rideNumbers: Locator;
  readonly rideNumbersHint: Locator;
  readonly keepAwakeText: Locator;
  readonly fullScreenOnStart: Locator;
  readonly fullScreenOnStartText: Locator;

  /** The option of a radio group by its words ("Match device", "On", "Large"). */
  option(group: Locator, name: string): Locator {
    return group.getByRole('radio', { name, exact: true });
  }

  /** "Check this device" and what it does (L2-162 AC1). */
  readonly checkHint: Locator;
  readonly check: Locator;
  /** The running check: its bar, "Trying High · 6 s left", the percentage and what the levels tried held (AC2). */
  readonly checkProgress: Locator;
  readonly checkLabel: Locator;
  readonly checkPercent: Locator;
  readonly checkFoot: Locator;
  readonly stopCheck: Locator;
  /** The finished check: the level that held, where Auto starts and when it was checked (AC3). */
  readonly checkResult: Locator;
  readonly checkAgain: Locator;

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

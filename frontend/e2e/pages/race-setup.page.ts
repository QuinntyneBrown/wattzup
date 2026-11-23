import type { Locator, Page } from '@playwright/test';

/** Race Setup at `/race/:mapId` (docs/mocks/pages/race-setup/). */
export class RaceSetupPage {
  readonly back: Locator;
  readonly photo: Locator;
  readonly title: Locator;
  readonly sub: Locator;
  readonly factLabels: Locator;
  readonly factValues: Locator;
  readonly starsTitle: Locator;
  readonly starRules: Locator;
  readonly goal: Locator;
  readonly goalTarget: Locator;
  readonly modes: Locator;
  readonly modeOptions: Locator;
  readonly onlineLock: Locator;
  readonly pack: Locator;
  readonly packOptions: Locator;
  readonly packNote: Locator;
  readonly start: Locator;

  constructor(private readonly page: Page) {
    this.back = page.locator('.setup-header').getByRole('link', { name: 'Maps' });
    this.photo = page.locator('.setup-map__photo img');
    this.title = page.getByRole('heading', { level: 1 });
    this.sub = page.locator('.setup-map__sub');
    this.factLabels = page.locator('.setup-fact__label');
    this.factValues = page.locator('.setup-fact__value');
    this.starsTitle = page.getByRole('heading', { name: 'Stars here' });
    this.starRules = page.locator('.setup-stars__item');
    this.goal = page.locator('.setup-goal');
    this.goalTarget = this.goal.locator('.setup-goal__goal');
    this.modes = page.getByRole('radiogroup', { name: 'Race mode' });
    this.modeOptions = this.modes.getByRole('radio');
    this.onlineLock = this.mode('Riders online').locator('.mode-option__lock');
    this.pack = page.getByRole('radiogroup', { name: 'Pack strength' });
    this.packOptions = this.pack.getByRole('radio');
    this.packNote = page.locator('.pack__note');
    this.start = page.locator('.setup-ride__start');
  }

  async open(mapId: string): Promise<void> {
    await this.page.goto(`/race/${mapId}`);
  }

  mode(name: string): Locator {
    return this.modes.getByRole('radio', { name: new RegExp(`^${name}`) });
  }

  packStrength(name: string): Locator {
    return this.pack.getByRole('radio', { name, exact: true });
  }
}

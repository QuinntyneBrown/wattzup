import type { Locator, Page } from '@playwright/test';

/** Custom workout at `/profile/custom` (docs/mocks/pages/custom-setup/, L2-094 to L2-097). */
export class CustomWorkoutPage {
  /** The training header: the lockup, the bike, Close and Full screen (L2-094 AC1). */
  readonly lockup: Locator;
  readonly bike: Locator;
  readonly close: Locator;
  readonly fullScreen: Locator;
  readonly heading: Locator;
  readonly lead: Locator;
  /** Training mode's two cards (L2-094 AC2). */
  readonly modes: Locator;
  readonly hiit: Locator;
  readonly flat: Locator;
  readonly modeBodies: Locator;
  /** HIIT's plans and ladder (L2-095). */
  readonly plans: Locator;
  readonly ladderTitle: Locator;
  readonly makeSame: Locator;
  readonly rounds: Locator;
  readonly addRound: Locator;
  /** The levels, warm-up and cool-down (L2-096). */
  readonly workLevel: Locator;
  readonly workLevelValue: Locator;
  readonly recoverLevel: Locator;
  readonly recoverLevelValue: Locator;
  readonly warmUp: Locator;
  readonly coolDown: Locator;
  /** Flat resistance's settings (L2-097). */
  readonly flatLevel: Locator;
  readonly flatLevelValue: Locator;
  readonly duration: Locator;
  readonly cadenceGoal: Locator;
  readonly note: Locator;

  constructor(private readonly page: Page) {
    const header = page.locator('.training-header');
    this.lockup = header.getByRole('img', { name: 'Telo Ride' });
    this.bike = header.locator('.training-header__bike');
    this.close = header.getByRole('link', { name: 'Close' });
    this.fullScreen = header.getByRole('button', { name: 'Full screen' });
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.setup__lead');
    this.modes = page.getByRole('radiogroup', { name: 'Training mode' });
    this.hiit = this.modes.getByRole('radio', { name: /HIIT intervals/ });
    this.flat = this.modes.getByRole('radio', { name: /Flat resistance/ });
    this.modeBodies = this.modes.locator('.training-mode__body');
    this.plans = page.getByRole('group', { name: 'Plans' }).getByRole('button');
    this.ladderTitle = page.locator('.ladder-block__title');
    this.makeSame = page.getByRole('button', { name: 'Make every round the same' });
    this.rounds = page.getByRole('list', { name: 'Rounds' }).getByRole('listitem');
    this.addRound = page.getByRole('button', { name: 'Add round' });
    this.workLevel = page.getByRole('slider', { name: 'Work resistance' });
    this.workLevelValue = this.sliderValue('Work resistance');
    this.recoverLevel = page.getByRole('slider', { name: 'Recover resistance' });
    this.recoverLevelValue = this.sliderValue('Recover resistance');
    this.warmUp = this.stepper('Warm-up');
    this.coolDown = this.stepper('Cool-down');
    this.flatLevel = page.getByRole('slider', { name: 'Resistance level' });
    this.flatLevelValue = this.sliderValue('Resistance level');
    this.duration = this.stepper('Duration');
    this.cadenceGoal = this.stepper('Cadence goal');
    this.note = page.locator('.setup__note');
  }

  /** A plan's chip by its name. */
  plan(name: string): Locator {
    return this.page.getByRole('group', { name: 'Plans' }).getByRole('button', { name });
  }

  /** Round `n`'s effort and recovery, as they read ("0:30", "3:00" or "Into cool-down"). */
  round(n: number): { effort: Locator; recovery: Locator } {
    const row = this.rounds.nth(n - 1);
    return {
      effort: row.locator('.mini-stepper__value').first(),
      recovery: row.locator('.mini-stepper__value, .interval-ladder__into').nth(1),
    };
  }

  /** A button of the ladder by its name ("Longer effort 1", "Remove round 8"). */
  ladder(name: string): Locator {
    return this.page
      .getByRole('list', { name: 'Rounds' })
      .getByRole('button', { name, exact: true });
  }

  /** A stepper's value, and its Less and More buttons. */
  private stepper(label: string): Locator {
    return this.page.getByRole('group', { name: label, exact: true });
  }

  stepperValue(stepper: Locator): Locator {
    return stepper.locator('.training-stepper__value');
  }

  less(stepper: Locator): Locator {
    return stepper.getByRole('button', { name: /^Less / });
  }

  more(stepper: Locator): Locator {
    return stepper.getByRole('button', { name: /^More / });
  }

  private sliderValue(label: string): Locator {
    return this.page
      .locator('.level-slider')
      .filter({ hasText: label })
      .locator('.level-slider__value');
  }

  async open(): Promise<void> {
    await this.page.goto('/profile/custom');
  }
}

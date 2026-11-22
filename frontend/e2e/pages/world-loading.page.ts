import { type Locator, type Page, expect } from '@playwright/test';

/** One of the load card's steps (block load-step): its label, its detail and its state in words. */
export interface LoadStepView {
  readonly root: Locator;
  readonly label: Locator;
  readonly detail: Locator;
}

/**
 * World loading at `/classes/:id/ride` (docs/mocks/pages/world-loading/): the class over its world's panorama, and the
 * load card with the three steps, the overall progress, the facts and Start riding.
 */
export class WorldLoadingPage {
  readonly root: Locator;
  readonly back: Locator;
  readonly panorama: Locator;
  readonly eyebrow: Locator;
  readonly title: Locator;
  readonly about: Locator;
  readonly planTotal: Locator;
  readonly planSummary: Locator;
  readonly cardTitle: Locator;
  readonly percent: Locator;
  readonly progress: Locator;
  readonly steps: Locator;
  readonly status: Locator;
  readonly facts: Locator;
  readonly notice: Locator;
  readonly warning: Locator;
  readonly alert: Locator;
  readonly hint: Locator;
  readonly start: Locator;
  readonly tryAgain: Locator;
  readonly panoramaRide: Locator;
  readonly startAtLow: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.world-loading');
    this.back = page.locator('.class-header').getByRole('link', { name: 'Back to class' });
    this.panorama = page.locator('.world-loading__scene img');
    this.eyebrow = page.locator('.world-loading__eyebrow');
    this.title = page.getByRole('heading', { level: 1 });
    this.about = page.locator('.world-loading__about');
    this.planTotal = page.locator('.class-plan__total');
    this.planSummary = page.locator('.class-plan__summary');
    this.cardTitle = page.locator('.load-card__title');
    this.percent = page.locator('.load-card__percent');
    this.progress = page.getByRole('progressbar');
    this.steps = page.getByRole('list', { name: 'Loading steps' }).getByRole('listitem');
    this.status = page.locator('.load-card__status');
    this.facts = page.locator('.load-card__facts .pill');
    this.notice = page.locator('.load-card .banner--info');
    this.warning = page.locator('.load-card .banner--warning');
    this.alert = page.locator('.load-card').getByRole('alert');
    this.hint = page.locator('.load-card__hint');
    this.start = page.locator('.load-card__actions').getByRole('button', { name: 'Start riding' });
    this.tryAgain = page.getByRole('button', { name: 'Try again' });
    this.panoramaRide = page.getByRole('button', { name: 'Ride with the panorama' });
    this.startAtLow = page.getByRole('button', { name: 'Start at Low quality' });
  }

  /** Waits for the world to be ready, then presses Start riding: the class ride takes World loading's place. */
  async startRiding(): Promise<void> {
    await expect(this.start).toBeEnabled();
    await this.start.click();
  }

  /** The step at `index`, from 0. */
  step(index: number): LoadStepView {
    const root = this.steps.nth(index);
    return {
      root,
      label: root.locator('.load-step__label'),
      detail: root.locator('.load-step__detail'),
    };
  }
}

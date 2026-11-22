import type { Locator, Page } from '@playwright/test';

/** The custom ride at `/profile/custom/ride` (docs/mocks/pages/custom-ride/, L2-101 to L2-104). */
export class CustomRidePage {
  /** The ride header (L2-101). */
  readonly lockup: Locator;
  readonly bike: Locator;
  readonly workout: Locator;
  readonly clock: Locator;
  readonly fullScreen: Locator;
  /** Power, Cadence and the interval card (L2-102). */
  readonly power: Locator;
  readonly powerFoot: Locator;
  readonly cadence: Locator;
  readonly cadenceFoot: Locator;
  readonly intervalName: Locator;
  readonly intervalRound: Locator;
  readonly countdown: Locator;
  readonly intervalBar: Locator;
  readonly next: Locator;
  /** The main view (L2-103). */
  readonly tabs: Locator;
  readonly videoTab: Locator;
  readonly chartTab: Locator;
  readonly sync: Locator;
  readonly legend: Locator;
  readonly trace: Locator;
  readonly traceMax: Locator;
  readonly progress: Locator;
  readonly ticks: Locator;
  /** The metrics (L2-104). */
  readonly metricLabels: Locator;
  readonly metricValues: Locator;
  /** The control aside (L2-028, L2-029). */
  readonly level: Locator;
  readonly lower: Locator;
  readonly raise: Locator;
  readonly levels: Locator;
  readonly mode: Locator;
  readonly sentLink: Locator;
  readonly sent: Locator;
  readonly sentEmpty: Locator;

  constructor(private readonly page: Page) {
    const header = page.locator('.ride-header');
    this.lockup = header.getByRole('img', { name: 'Telo Ride' });
    this.bike = header.locator('.ride-header__status');
    this.workout = header.locator('a.ride-header__link').filter({ hasText: 'edit workout' });
    this.clock = header.getByRole('timer');
    this.fullScreen = header.getByRole('button', { name: 'Full screen' });
    const telemetry = page.getByRole('region', { name: 'Telemetry' });
    this.power = telemetry.locator('.ride-readout__number--power');
    this.powerFoot = telemetry.locator('.ride-readout__foot').first();
    this.cadence = telemetry.locator('.ride-readout__number--cadence');
    this.cadenceFoot = telemetry.locator('.ride-readout__foot').nth(1);
    const interval = telemetry.locator('.ride-interval');
    this.intervalName = interval.locator('.ride-interval__name');
    this.intervalRound = interval.locator('.ride-interval__round');
    this.countdown = interval.getByRole('timer');
    this.intervalBar = interval.getByRole('progressbar', { name: 'Interval progress' });
    this.next = interval.locator('.ride-interval__next');
    this.tabs = page.getByRole('tablist', { name: 'Main view' }).getByRole('tab');
    this.videoTab = page.getByRole('tab', { name: 'Video' });
    this.chartTab = page.getByRole('tab', { name: 'Power vs. plan' });
    this.sync = page.locator('.ride-view__sync');
    this.legend = page.locator('.ride-view__legend-item');
    this.trace = page.getByRole('img', { name: /^Power against the plan/ });
    this.traceMax = page.locator('.ride-trace__max');
    this.progress = page.getByRole('img', { name: /^Ride progress/ });
    this.ticks = page.locator('.ride-ticks__tick');
    this.metricLabels = page.locator('.ride-metric__label');
    this.metricValues = page.locator('.ride-metric__value');
    const control = page.getByRole('complementary', { name: 'Resistance' });
    this.level = control.locator('.ride-control__level-number');
    this.lower = control.getByRole('button', { name: 'Lower resistance' });
    this.raise = control.getByRole('button', { name: 'Raise resistance' });
    this.levels = control
      .getByRole('group', { name: 'Pick a resistance level' })
      .getByRole('button');
    this.mode = control.locator('.ride-control__mode');
    this.sentLink = control.locator('.ride-log__link');
    this.sent = control.locator('.ride-log__item');
    this.sentEmpty = control.locator('.ride-log__empty');
  }

  async open(): Promise<void> {
    await this.page.goto('/profile/custom/ride');
  }
}

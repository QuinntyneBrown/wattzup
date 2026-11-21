import type { Locator, Page } from '@playwright/test';

/** The ride dashboard at `/`. Owns its selectors. */
export class RidePage {
  readonly statusName: Locator;
  readonly statusState: Locator;
  /** The "Connect your bike" panel over the ride (L2-090 AC1). */
  readonly connectPanel: Locator;
  readonly connectButton: Locator;
  /** The alert overlay that replaces Connect bike when the browser cannot reach Bluetooth. */
  readonly notice: Locator;
  readonly noticeTitle: Locator;
  readonly copyLinkButton: Locator;
  readonly openOverHttps: Locator;
  readonly checkAgainButton: Locator;
  readonly libraryLink: Locator;
  readonly toasts: Locator;
  readonly powerValue: Locator;
  readonly cadenceValue: Locator;
  readonly levelValue: Locator;
  readonly raiseButton: Locator;
  readonly rideClock: Locator;
  readonly rideSoundButton: Locator;
  readonly pauseButton: Locator;
  readonly resumeButton: Locator;
  readonly endButton: Locator;
  /** The entries of the Sent to bike log (L2-048). */
  readonly commandEntries: Locator;
  readonly main: Locator;
  readonly aside: Locator;
  readonly power: Locator;
  readonly metrics: Locator;
  readonly timeLeft: Locator;
  readonly phaseBanner: Locator;
  readonly traceCanvas: Locator;

  constructor(private readonly page: Page) {
    this.statusName = page.locator('.statusline__name');
    this.statusState = page.locator('.statusline__state');
    this.connectPanel = page.getByRole('region', { name: 'Connect your bike' });
    this.connectButton = this.connectPanel.getByRole('button', { name: 'Connect bike' });
    this.toasts = page.locator('.toast-region .toast');
    this.notice = page.locator('.overlay-panel__card[role="alert"]');
    this.noticeTitle = this.notice.getByRole('heading', { level: 2 });
    this.copyLinkButton = this.notice.getByRole('button', { name: /^(Copy link|Link copied)$/ });
    this.openOverHttps = this.notice.getByRole('link', { name: 'Open over HTTPS' });
    this.checkAgainButton = this.notice.getByRole('button', { name: 'Check again' });
    this.libraryLink = page.getByRole('banner').getByRole('link', { name: 'Library' });
    this.powerValue = page.locator('.readout--power .numeral');
    this.cadenceValue = page.locator('.readout--cadence .numeral');
    this.levelValue = page.locator('.level-readout .numeral');
    const bar = page.locator('.app-bar');
    this.rideClock = bar.locator('.ride-clock');
    this.rideSoundButton = page.getByRole('button', { name: /^Ride sound (on|off)$/ });
    this.pauseButton = bar.getByRole('button', { name: 'Pause', exact: true });
    this.resumeButton = bar.getByRole('button', { name: 'Resume', exact: true });
    this.endButton = bar.getByRole('button', { name: 'End', exact: true });
    const aside = page.getByRole('complementary', { name: 'Bike control' });
    this.raiseButton = aside.getByRole('button', { name: 'Raise resistance' });
    this.commandEntries = aside.getByRole('region', { name: 'Sent to bike' }).locator('li');
    this.aside = aside;
    this.main = page.locator('#main');
    this.power = page.locator('.readout--power');
    this.metrics = page.locator('.metrics');
    this.timeLeft = page.locator('.interval .interval__left');
    this.phaseBanner = page.locator('.phase-banner');
    this.traceCanvas = page.locator('figure.trace canvas');
  }

  /** One value of the metrics list, by its term (`Speed`, `Distance`…). */
  metric(term: string): Locator {
    return this.page.locator('.metrics > div').filter({ hasText: term }).locator('dd');
  }

  /** Waits until the service worker controls the page with a version installed and its own
   * requests have settled, so the page loads without the network (L2-098 AC1). */
  async waitUntilKeptOffline(): Promise<void> {
    await this.page.evaluate(() => navigator.serviceWorker.ready);
    // The first load registers the worker; a reload puts the page under its control.
    if (!(await this.page.evaluate(() => !!navigator.serviceWorker.controller))) {
      await this.page.reload();
    }
    await this.page.waitForFunction(
      async () =>
        /Latest manifest hash: [0-9a-f]{40}/.test(await (await fetch('/ngsw/state')).text()),
      undefined,
      { polling: 250 },
    );
    // The worker serves the app offline only once every file it prefetches is in its cache; the
    // manifest arriving is not enough while large chunks are still downloading.
    await this.page.waitForFunction(
      async () => {
        const manifest = (await (await fetch('/ngsw.json')).json()) as {
          assetGroups: { installMode: string; urls: string[] }[];
        };
        const urls = manifest.assetGroups
          .filter((g) => g.installMode === 'prefetch')
          .flatMap((g) => g.urls);
        const cached = await Promise.all(urls.map((u) => caches.match(u)));
        return cached.every(Boolean);
      },
      undefined,
      { polling: 250 },
    );
    // Going offline while the worker checks for an update leaves it serving nothing.
    await this.page.waitForLoadState('networkidle');
  }

  /** The web app manifest the page links (L2-098 AC2). */
  async manifest(): Promise<Record<string, unknown>> {
    const href = await this.page.locator('link[rel="manifest"]').getAttribute('href');
    return this.page.evaluate(async (url) => (await fetch(url!)).json(), href);
  }

  /** `192x192`: the size of the image at `src`, as the browser decodes it. */
  imageSize(src: string): Promise<string> {
    return this.page.evaluate(async (url) => {
      const image = await createImageBitmap(await (await fetch(url)).blob());
      return `${image.width}x${image.height}`;
    }, src);
  }

  /** The policy of the page's Content-Security-Policy <meta> element (L2-097 AC2). */
  async contentSecurityPolicy(): Promise<string> {
    return (
      (await this.page
        .locator('meta[http-equiv="Content-Security-Policy"]')
        .getAttribute('content')) ?? ''
    );
  }

  async open(query = ''): Promise<void> {
    await this.page.goto(`/${query}`);
  }

  async connect(): Promise<void> {
    await this.connectButton.click();
  }
}

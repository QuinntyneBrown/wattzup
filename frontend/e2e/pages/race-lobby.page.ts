import type { Locator, Page } from '@playwright/test';

/** The race lobby at `/race/:mapId/lobby` (docs/mocks/pages/race-lobby/): the header, the start clock and the grid. */
export class RaceLobbyPage {
  readonly heading: Locator;
  readonly title: Locator;
  readonly leave: Locator;
  readonly fullScreen: Locator;
  readonly status: Locator;
  readonly clock: Locator;
  readonly hint: Locator;
  readonly notice: Locator;
  readonly ready: Locator;
  readonly gridTitle: Locator;
  readonly count: Locator;
  readonly seats: Locator;
  readonly readyChecks: Locator;
  /** The 3, 2, 1, Go overlay, its numeral, and the page behind it, which it makes inert (L2-056). */
  readonly countdown: Locator;
  readonly countdownStep: Locator;
  readonly behind: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.title = page.locator('.race-lobby__title');
    this.leave = page.locator('.race-lobby__header').getByRole('link', { name: 'Leave' });
    this.fullScreen = page
      .locator('.race-lobby__header')
      .getByRole('button', { name: 'Full screen' });
    this.status = page.locator('.race-lobby__status');
    this.clock = page.locator('.race-lobby__clock');
    this.hint = page.locator('.race-lobby__hint');
    this.notice = page.locator('.race-lobby__notice');
    this.ready = page.locator('.race-lobby__ready');
    this.gridTitle = page.locator('.start-grid__title');
    this.count = page.locator('.start-grid__count');
    this.seats = page.locator('.start-grid__seat');
    this.readyChecks = this.seats.getByRole('img', { name: 'Ready' });
    this.countdown = page.locator('.race-countdown');
    this.countdownStep = this.countdown.locator('.race-countdown__num');
    this.behind = page.locator('.race-lobby__scroll');
  }

  async open(mapId: string, query: string): Promise<void> {
    await this.page.goto(`/race/${mapId}/lobby?${query}`);
  }

  /** Each seat as "1 You Lv 1", "2 Pacer Nova Bot ready" or "7 Open seat": number, name, meta, and its check. */
  async seatLines(): Promise<string[]> {
    return this.seats.evaluateAll((seats) =>
      seats.map((seat) =>
        [
          seat.querySelector('.start-grid__num')?.textContent,
          seat.querySelector('.start-grid__name, .start-grid__open')?.textContent,
          seat.querySelector('.start-grid__meta')?.textContent,
          seat.querySelector('.start-grid__check') ? 'ready' : null,
        ]
          .map((part) => part?.trim())
          .filter(Boolean)
          .join(' '),
      ),
    );
  }
}

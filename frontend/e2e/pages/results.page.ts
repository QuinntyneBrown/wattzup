import { type Locator, type Page, expect } from '@playwright/test';

/** One animation of the unlock card's entrance: its duration and delay in milliseconds and what it changes. */
export interface Entrance {
  readonly duration: number;
  readonly delay: number;
  readonly properties: string[];
}

/** Results at `/results` (docs/mocks/pages/results/): the header, the result, the final standings and the actions. */
export class ResultsPage {
  /** What was ridden: "Old Town Criterium · vs Bots". */
  readonly context: Locator;
  /** The hidden heading: "Race results" or "Class results". */
  readonly heading: Locator;
  readonly lead: Locator;
  /** The place ("2nd") or the time ("30:00"). */
  readonly big: Locator;
  /** "of 10" beside a place. */
  readonly of: Locator;
  readonly sub: Locator;
  readonly standings: Locator;
  readonly rows: Locator;
  /** The rider's own row in the standings. */
  readonly you: Locator;
  readonly done: Locator;
  /** The XP panel: "XP earned", the total ("+442"), its lines and, while it waits or has failed, its note. */
  readonly xp: Locator;
  readonly xpTotal: Locator;
  readonly xpLines: Locator;
  readonly xpNote: Locator;
  /** The stars panel: "Stars on {map}", the stars as one image ("2 of 3 stars") and the new-star line. */
  readonly starsPanel: Locator;
  readonly starsTitle: Locator;
  readonly stars: Locator;
  readonly newStars: Locator;
  /** "Race it again" or "Ride it again". */
  readonly again: Locator;
  /** The gold card of a map the ride opened: its photo, "{map} is open", the place line and "Ride {map}". */
  readonly unlockCard: Locator;
  readonly unlockPhoto: Locator;
  readonly unlockTitle: Locator;
  readonly unlockPlace: Locator;
  readonly unlockAction: Locator;

  constructor(private readonly page: Page) {
    this.context = page.locator('.results-header__context');
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.results__lead');
    this.big = page.locator('.results__big');
    this.of = page.locator('.results__of');
    this.sub = page.locator('.results__sub');
    this.standings = page.getByRole('list', { name: 'Final standings' });
    this.rows = this.standings.getByRole('listitem');
    this.you = this.standings.locator('[aria-current="true"]');
    this.done = page.getByRole('link', { name: 'Done', exact: true });
    this.xp = page.getByRole('region', { name: 'XP earned' });
    this.xpTotal = this.xp.locator('.xp-earned__total');
    this.xpLines = this.xp.locator('.xp-earned__line');
    this.xpNote = this.xp.getByRole('status');
    this.starsPanel = page.locator('.map-stars');
    this.starsTitle = this.starsPanel.getByRole('heading');
    this.stars = this.starsPanel.getByRole('img');
    this.newStars = this.starsPanel.locator('.map-stars__new');
    this.unlockCard = page.locator('.unlock-card');
    this.unlockPhoto = this.unlockCard.locator('.unlock-card__photo');
    this.unlockTitle = this.unlockCard.locator('.unlock-card__title');
    this.unlockPlace = this.unlockCard.locator('.unlock-card__place');
    this.unlockAction = this.unlockCard.getByRole('link');
    this.again = page.getByRole('link', { name: /it again$/ });
  }

  /** The row's name and value, as "Pacer Nova 26:32". */
  rowText(row: Locator): Promise<string> {
    return row.evaluate((element) =>
      [...element.querySelectorAll('.standings__name, .standings__value')]
        .map((part) => part.textContent?.trim())
        .join(' '),
    );
  }

  /** The XP lines as "Finished +100". */
  xpLineTexts(): Promise<string[]> {
    return this.xpLines.evaluateAll((lines) =>
      lines.map((line) => [...line.children].map((part) => part.textContent?.trim()).join(' ')),
    );
  }

  /**
   * The unlock card's entrance as the rider sees it: for the card and its photo, each animation's duration and delay in
   * milliseconds and the properties it changes.
   */
  unlockEntrance(): Promise<{ card: Entrance[]; photo: Entrance[] }> {
    const read = (element: Element) =>
      element.getAnimations().map((animation) => {
        const effect = animation.effect as KeyframeEffect;
        const timing = effect.getComputedTiming();
        const properties = Object.keys(effect.getKeyframes()[0]).filter(
          (key) => !['offset', 'computedOffset', 'easing', 'composite'].includes(key),
        );
        return {
          duration: Number(timing.duration),
          delay: Number(timing.delay),
          properties: properties.sort(),
        };
      });
    return Promise.all([this.unlockCard.evaluate(read), this.unlockPhoto.evaluate(read)]).then(
      ([card, photo]) => ({ card, photo }),
    );
  }

  /** Whether a row carries the bot marker, named "Bot". */
  bot(row: Locator): Locator {
    return row.getByRole('img', { name: 'Bot' });
  }

  /** Steps the paused clock until the lazily loaded Results has rendered. */
  async shown(): Promise<void> {
    await expect(async () => {
      await this.page.clock.runFor(16);
      await expect(this.lead).toBeVisible({ timeout: 50 });
    }).toPass({ intervals: [0] });
  }

  async open(): Promise<void> {
    await this.page.goto('/results');
  }
}

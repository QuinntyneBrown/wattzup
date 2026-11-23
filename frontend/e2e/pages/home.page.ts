import type { Locator, Page } from '@playwright/test';
import { AppHeader } from './app-header';

/** Home at `/` (docs/mocks/pages/home/): the greeting, the unlocked banner, the Next ride card and the two doors. */
export class HomePage {
  readonly header: AppHeader;
  readonly skipLink: Locator;
  readonly main: Locator;
  readonly greeting: Locator;
  /** The unlocked banner (L2-036). */
  readonly banner: Locator;
  readonly bannerBody: Locator;
  readonly bannerAction: Locator;
  /** The Next ride card (block next-ride, L2-033). */
  readonly card: Locator;
  readonly cardPhoto: Locator;
  readonly cardBody: Locator;
  readonly cardTag: Locator;
  readonly cardEyebrow: Locator;
  readonly cardGoal: Locator;
  readonly reward: Locator;
  readonly rewardTitle: Locator;
  readonly rewardPlace: Locator;
  readonly cardBest: Locator;
  readonly cardAction: Locator;
  /** The Race door (L2-034). */
  readonly raceDoor: Locator;
  readonly allMaps: Locator;
  readonly raceSummary: Locator;
  readonly tiles: Locator;
  readonly tileNames: Locator;
  readonly tileStars: Locator;
  /** The Classes door (L2-035). */
  readonly classDoor: Locator;
  readonly allClasses: Locator;
  readonly classSummary: Locator;
  readonly teaser: Locator;
  readonly teaserTitle: Locator;
  readonly teaserLength: Locator;
  readonly teaserActions: Locator;

  constructor(private readonly page: Page) {
    this.header = new AppHeader(page);
    this.skipLink = page.getByRole('link', { name: 'Skip to content' });
    this.main = page.locator('main#main');
    this.greeting = page.getByRole('heading', { level: 1 });
    this.banner = this.main.locator('.banner');
    this.bannerBody = this.banner.locator('.banner__body');
    this.bannerAction = this.banner.getByRole('link');
    this.card = page.locator('.next-ride');
    this.cardPhoto = this.card.locator('.next-ride__photo');
    this.cardBody = this.card.locator('.next-ride__body');
    this.cardTag = this.cardPhoto.locator('.photo-tag');
    this.cardEyebrow = this.card.locator('.next-ride__eyebrow');
    this.cardGoal = this.card.getByRole('heading', { level: 2 });
    this.reward = this.card.locator('.reward');
    this.rewardTitle = this.reward.locator('.reward__title');
    this.rewardPlace = this.reward.locator('.reward__place');
    this.cardBest = this.card.locator('.next-ride__best');
    this.cardAction = this.card.locator('.next-ride__cta').getByRole('link');
    this.raceDoor = page.getByRole('region', { name: 'Race', exact: true });
    this.allMaps = this.raceDoor.getByRole('link', { name: 'All maps' });
    this.raceSummary = this.raceDoor.locator('.door__summary');
    this.tiles = this.raceDoor.locator('.map-tile');
    this.tileNames = this.tiles.locator('.map-tile__name');
    this.tileStars = this.tiles.getByRole('img');
    this.classDoor = page.getByRole('region', { name: 'Classes', exact: true });
    this.allClasses = this.classDoor.getByRole('link', { name: 'All classes' });
    this.classSummary = this.classDoor.locator('.door__summary');
    this.teaser = this.classDoor.locator('.class-teaser');
    this.teaserTitle = this.teaser.getByRole('heading', { level: 3 });
    this.teaserLength = this.teaser.locator('.class-teaser__cover .photo-tag');
    this.teaserActions = this.teaser.locator('.class-teaser__actions').getByRole('link');
  }

  /** The Race door's tile for `name`. */
  tile(name: string): Locator {
    return this.tiles.filter({ hasText: name });
  }

  /** Whether anything on the page reaches past the viewport's right edge. */
  overflows(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  url(): string {
    return new URL(this.page.url()).pathname;
  }

  background(): Promise<string> {
    return this.page
      .locator('.app')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
  }
}

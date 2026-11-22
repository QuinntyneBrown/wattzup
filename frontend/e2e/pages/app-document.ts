import type { Locator, Page } from '@playwright/test';

/**
 * The page as a whole, as the display settings change it (L2-164): the `<html>` element's attributes, a token's
 * value and whether the page scrolls sideways.
 */
export class AppDocument {
  /** `<html>`: `data-theme`, `data-motion` and `data-ride-numbers`. */
  readonly root: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('html');
  }

  /** A duration token's value on `<html>` in milliseconds, such as `--duration-base` (the build writes 200ms as .2s). */
  duration(name: string): Promise<number> {
    return this.root.evaluate((html, token) => {
      const value = getComputedStyle(html).getPropertyValue(token).trim();
      return value.endsWith('ms') ? parseFloat(value) : parseFloat(value) * 1000;
    }, name);
  }

  /** The page's background colour, which the theme sets. */
  background(): Promise<string> {
    return this.page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  }

  /** Whether the app is in full screen. */
  inFullScreen(): Promise<boolean> {
    return this.page.evaluate(() => document.fullscreenElement !== null);
  }

  scrollsSideways(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  }

  /** A font size in pixels. */
  static fontSize(locator: Locator): Promise<number> {
    return locator.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  }
}

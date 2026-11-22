import type { Locator, Page } from '@playwright/test';

/**
 * The page as a whole, as the display settings change it (L2-164): the `<html>` element's attributes, a token's
 * value and whether the page scrolls sideways; and the page container every screen's content sits in (L2-139).
 */
export class AppDocument {
  /** `<html>`: `data-theme`, `data-motion` and `data-ride-numbers`. */
  readonly root: Locator;
  /** The page's main content in its container: the page margin either side, at most 80 rem wide (L2-139 AC2). */
  readonly container: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('html');
    this.container = page.locator('main.container');
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

  /** The container's box and its content box: where it sits, how wide it is and its padding either side, in px. */
  layout(): Promise<{ left: number; width: number; paddingLeft: number; paddingRight: number }> {
    return this.container.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        left: box.left,
        width: box.width,
        paddingLeft: parseFloat(style.paddingLeft),
        paddingRight: parseFloat(style.paddingRight),
      };
    });
  }

  scrollsSideways(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  }

  /** A font size in pixels. */
  static fontSize(locator: Locator): Promise<number> {
    return locator.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  }
}

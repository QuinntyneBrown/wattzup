import type { Locator, Page } from '@playwright/test';

/**
 * The page as a whole, as the display settings change it (L2-164): the `<html>` element's attributes, a token's
 * value and whether the page scrolls sideways; and the page container every screen's content sits in (L2-139).
 */
/** What a rider taps or tabs to: links, buttons, inputs and anything else in the tab order. */
const CONTROLS =
  'a[href], button:not(:disabled), input:not([type="hidden"]):not(:disabled), select, textarea, summary, [tabindex]:not([tabindex="-1"])';

export class AppDocument {
  /** `<html>`: `data-theme`, `data-motion` and `data-ride-numbers`. */
  readonly root: Locator;
  /** The page's main content in its container: the page margin either side, at most 80 rem wide (L2-139 AC2). */
  readonly container: Locator;
  /** The app itself, behind any dialog: inert while one is open (L2-141 AC3). */
  readonly app: Locator;
  /** What a screen reader hears: the one live region the app announces through (L2-141 AC2). */
  readonly announcement: Locator;
  /** "Full screen" in the page's header, whichever header the screen has (L2-144 AC1). */
  readonly fullScreen: Locator;
  /** "Exit full screen" in the page's header, in full screen. */
  readonly exitFullScreen: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('html');
    this.container = page.locator('main.container');
    this.app = page.locator('wz-root');
    this.announcement = page.locator('.live-announcer');
    this.fullScreen = page
      .locator('header')
      .getByRole('button', { name: 'Full screen', exact: true });
    this.exitFullScreen = page
      .locator('header')
      .getByRole('button', { name: 'Exit full screen', exact: true });
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

  /**
   * The body's background as the served page and its stylesheets paint it before the app's scripts run: opens `path`
   * with every script held back, reads the background once the global stylesheet applies, then lets the scripts load.
   */
  async firstPaint(path: string): Promise<string> {
    let release = (): void => undefined;
    const held = new Promise<void>((resolve) => (release = resolve));
    const scripts = /\.m?js(\?.*)?$/;
    await this.page.route(scripts, async (route) => {
      await held;
      await route.continue();
    });
    await this.page.goto(path, { waitUntil: 'commit' });
    await this.page.waitForFunction(
      () =>
        document.body !== null &&
        [...document.styleSheets].some((sheet) => {
          try {
            return sheet.cssRules.length > 0;
          } catch {
            return false;
          }
        }),
    );
    const background = await this.background();
    release();
    await this.page.unroute(scripts);
    return background;
  }

  /**
   * Each pair of a text colour token on a surface token, in the theme showing now, whose contrast is below `ratio`, as
   * `--text on --surface: 3.21` (WCAG 2.2 relative luminance).
   */
  lowContrast(
    texts: readonly string[],
    surfaces: readonly string[],
    ratio: number,
  ): Promise<string[]> {
    return this.page.evaluate(
      ({ texts, surfaces, ratio }) => {
        const probe = document.body.appendChild(document.createElement('div'));
        const rgb = (property: 'color' | 'backgroundColor', token: string): number[] => {
          probe.style[property] = `var(${token})`;
          return (getComputedStyle(probe)[property].match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        };
        const luminance = (channels: number[]): number => {
          const [r, g, b] = channels.map((c) => {
            const v = c / 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
        };
        const low: string[] = [];
        for (const surface of surfaces) {
          const behind = luminance(rgb('backgroundColor', surface));
          for (const text of texts) {
            const front = luminance(rgb('color', text));
            const contrast = (Math.max(front, behind) + 0.05) / (Math.min(front, behind) + 0.05);
            if (contrast < ratio) low.push(`${text} on ${surface}: ${contrast.toFixed(2)}`);
          }
        }
        probe.remove();
        return low;
      },
      { texts, surfaces, ratio },
    );
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

  /**
   * The controls a tap of `size` px misses (L2-140 AC2): each control on the page is scrolled into the middle of the
   * window, and a tap at each edge of a `size` × `size` square centred on it must reach the control (or the label of
   * an input). Its look may be smaller; its tap area may not. Resolves to a description of each control it misses.
   */
  async untappable(size: number, except: readonly string[] = []): Promise<string[]> {
    const controls = this.page.locator(CONTROLS);
    const missed: string[] = [];
    for (const control of await controls.all()) {
      const miss = await control.evaluate(
        (element, [side, skipped]) => {
          if (skipped.some((selector) => element.matches(selector))) return null;
          if (
            element.classList.contains('skip-link') ||
            element.closest('[inert], [aria-hidden="true"]')
          )
            return null;
          let box = element.getBoundingClientRect();
          if (box.width === 0 && box.height === 0) return null;
          element.scrollIntoView({ block: 'center', inline: 'center' });
          box = element.getBoundingClientRect();
          const reach = side / 2 - 1;
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          const label = element instanceof HTMLInputElement ? element.labels?.[0] : undefined;
          const reaches = (hit: Element | null) =>
            !!hit && (element.contains(hit) || (!!label && label.contains(hit)));
          const points = [
            [x, y - reach],
            [x, y + reach],
            [x - reach, y],
            [x + reach, y],
          ];
          if (points.every(([px, py]) => reaches(document.elementFromPoint(px, py)))) return null;
          const name = (element.getAttribute('aria-label') ?? element.textContent ?? '')
            .trim()
            .replace(/\s+/g, ' ');
          return `${element.tagName.toLowerCase()}.${element.classList[0] ?? ''} "${name.slice(0, 40)}" ${Math.round(box.width)}×${Math.round(box.height)}`;
        },
        [size, except] as const,
      );
      if (miss) missed.push(miss);
    }
    return missed;
  }

  /**
   * Tabs through the page from its start (L2-140 AC1): each stop the focus lands on until it leaves the page, with
   * whether it shows a focus ring (an outline or a box shadow) and whether it is drawn in the window.
   */
  async tabStops(limit = 80): Promise<{ name: string; ring: boolean; shown: boolean }[]> {
    await this.page.evaluate(() => {
      (document.activeElement as HTMLElement | null)?.blur();
      (window as { __tabbed?: WeakSet<Element> }).__tabbed = new WeakSet();
    });
    const stops: { name: string; ring: boolean; shown: boolean }[] = [];
    let wraps = 0;
    for (let i = 0; i < limit; i++) {
      await this.page.keyboard.press('Tab');
      const stop = await this.page.evaluate(() => {
        const e = document.activeElement;
        const tabbed = (window as { __tabbed?: WeakSet<Element> }).__tabbed!;
        if (!e || e === document.body) return 'body';
        if (tabbed.has(e)) return null;
        tabbed.add(e);
        const style = getComputedStyle(e);
        const box = e.getBoundingClientRect();
        const outlined = (style: CSSStyleDeclaration) =>
          style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
        // The ring is the control's outline or box shadow, or an outline it draws on a part of itself (a card's cover).
        const ring =
          outlined(style) ||
          (style.boxShadow !== 'none' && style.boxShadow !== '') ||
          [...e.querySelectorAll('*')].some((part) => outlined(getComputedStyle(part)));
        const shown =
          box.width > 0 &&
          box.height > 0 &&
          box.bottom > 0 &&
          box.right > 0 &&
          box.top < innerHeight &&
          box.left < innerWidth;
        const name = (e.getAttribute('aria-label') ?? e.textContent ?? '')
          .trim()
          .replace(/\s+/g, ' ');
        return {
          name: `${e.tagName.toLowerCase()}.${e.classList[0] ?? ''} "${name.slice(0, 40)}"`,
          ring,
          shown,
        };
      });
      if (!stop) break;
      // From the body or the window's edge, Tab passes through the page itself once before the first control.
      if (stop === 'body') {
        if (++wraps > 2) break;
        continue;
      }
      stops.push(stop);
    }
    return stops;
  }

  /**
   * What still moves (L2-142 AC2): each running animation, and each element whose transition of anything but its
   * opacity, or whose CSS animation, takes longer than nothing. Resolves to a description of each.
   */
  moving(): Promise<string[]> {
    return this.page.evaluate(() => {
      const moving = new Set<string>();
      const name = (element: Element) =>
        `${element.tagName.toLowerCase()}.${element.classList[0] ?? ''}`;
      for (const element of document.querySelectorAll('*')) {
        const style = getComputedStyle(element);
        const durations = style.transitionDuration
          .split(',')
          .map((duration) => parseFloat(duration));
        style.transitionProperty.split(',').forEach((property, i) => {
          if (property.trim() !== 'opacity' && durations[i % durations.length] > 0) {
            moving.add(`transition of ${property.trim()} on ${name(element)}`);
          }
        });
        const animated = style.animationDuration
          .split(',')
          .some((duration) => parseFloat(duration) > 0);
        if (style.animationName !== 'none' && animated)
          moving.add(`animation ${style.animationName} on ${name(element)}`);
      }
      return [...moving];
    });
  }

  /** Whether the focus is on `region` or something in it. */
  static holdsFocus(region: Locator): Promise<boolean> {
    return region.evaluate((element) => element.contains(document.activeElement));
  }

  scrollsSideways(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  }

  /** A font size in pixels. */
  static fontSize(locator: Locator): Promise<number> {
    return locator.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  }
}

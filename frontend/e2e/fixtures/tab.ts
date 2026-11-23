// The browser tab hidden or shown, as when the rider switches tabs (L2-065 AC3, L2-133). Headless Chromium keeps its
// one page visible, so the page's `document.hidden` and `visibilityState` are set by hand and `visibilitychange` sent.
import type { Page } from '@playwright/test';

/** Chrome's intensive throttling: in a tab hidden for a while, timers run at most once a minute (L2-133 AC2). */
const THROTTLED_MS = 60_000;

/**
 * Throttles the page's timers as a hidden tab's: each `setTimeout` waits for the next whole minute of the page's clock.
 * Bike notifications still arrive as they come, since they are events, not timers. Undone by `showTab`.
 */
async function throttle(page: Page): Promise<void> {
  await page.evaluate((minute) => {
    const page = window as unknown as {
      setTimeout: typeof setTimeout;
      unthrottled?: typeof setTimeout;
    };
    page.unthrottled ??= page.setTimeout;
    const unthrottled = page.unthrottled;
    page.setTimeout = ((handler: TimerHandler, ms = 0, ...args: unknown[]) => {
      const now = performance.now();
      return unthrottled(handler, Math.ceil((now + ms) / minute) * minute - now, ...args);
    }) as typeof setTimeout;
  }, THROTTLED_MS);
}

async function setHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((value) => {
    const page = window as unknown as {
      setTimeout: typeof setTimeout;
      unthrottled?: typeof setTimeout;
    };
    if (!value && page.unthrottled) page.setTimeout = page.unthrottled;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (value ? 'hidden' : 'visible'),
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

/** Hides the tab; with `throttled`, its timers then run at most once a minute, as Chrome's do after a while. */
export async function hideTab(page: Page, { throttled = false } = {}): Promise<void> {
  if (throttled) await throttle(page);
  await setHidden(page, true);
}
/** Shows the tab again, its timers no longer throttled. */
export const showTab = (page: Page) => setHidden(page, false);

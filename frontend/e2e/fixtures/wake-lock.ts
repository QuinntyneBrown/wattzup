import type { Page } from '@playwright/test';

/** A screen lock the app asked for, as the fake recorded it. */
export interface WakeLockRecord {
  readonly type: string;
  readonly released: boolean;
}

declare global {
  interface Window {
    __fakeWakeLocks?: { type: string; released: boolean }[];
  }
}

/**
 * Installs a fake Screen Wake Lock API before the app loads, so no spec takes a real lock (headless Chromium refuses
 * one). Like the browser, it releases every lock when the tab is hidden; `hide()` and `show()` stand in for the rider
 * switching tabs.
 */
export class WakeLockFixture {
  private constructor(private readonly page: Page) {}

  static async install(page: Page): Promise<WakeLockFixture> {
    await page.addInitScript(() => {
      const locks: { type: string; released: boolean }[] = [];
      window.__fakeWakeLocks = locks;
      const sentinels: (EventTarget & { release(): Promise<void> })[] = [];
      Object.defineProperty(navigator, 'wakeLock', {
        configurable: true,
        value: {
          request(type: string) {
            const record = { type, released: false };
            locks.push(record);
            const sentinel = Object.assign(new EventTarget(), {
              type,
              get released() {
                return record.released;
              },
              async release() {
                if (record.released) return;
                record.released = true;
                sentinel.dispatchEvent(new Event('release'));
              },
            });
            sentinels.push(sentinel);
            return Promise.resolve(sentinel);
          },
        },
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') for (const s of sentinels) void s.release();
      });
    });
    return new WakeLockFixture(page);
  }

  /** Every lock the app asked for, in order. */
  locks(): Promise<WakeLockRecord[]> {
    return this.page.evaluate(() => (window.__fakeWakeLocks ?? []).map((lock) => ({ ...lock })));
  }

  /** The rider switches to another tab. */
  hide(): Promise<void> {
    return this.visibility('hidden');
  }

  /** The rider comes back to the tab. */
  show(): Promise<void> {
    return this.visibility('visible');
  }

  private visibility(state: 'hidden' | 'visible'): Promise<void> {
    return this.page.evaluate((value) => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value });
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => value === 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    }, state);
  }
}

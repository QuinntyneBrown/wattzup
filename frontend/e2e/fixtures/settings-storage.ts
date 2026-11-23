import type { Page } from '@playwright/test';

/** Where the ride settings live in localStorage (docs/detailed-designs/settings/open-and-keep-settings). */
export const RIDE_SETTINGS_KEY = 'telo-ride.settings.v1';

/** Stores the raw value of the ride settings before the app loads, as a rider's earlier visit left it. */
export async function storeSettings(page: Page, raw: string): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      // Once per value, so a reload keeps what the app wrote since, and a later call can store again.
      const stored = `stored ${value}`;
      if (!sessionStorage.getItem(stored)) {
        localStorage.setItem(key, value);
        sessionStorage.setItem(stored, 'yes');
      }
    },
    [RIDE_SETTINGS_KEY, raw] as const,
  );
}

/** The ride settings this browser keeps, parsed, or null when none are kept. */
export async function storedSettings(page: Page): Promise<unknown> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as unknown);
  }, RIDE_SETTINGS_KEY);
}

/** Makes the browser refuse localStorage, as a private window or blocked site data does (L2-158 AC7). */
export async function refuseStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });
  });
}

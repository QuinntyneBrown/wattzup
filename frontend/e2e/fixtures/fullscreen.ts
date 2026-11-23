import type { Page } from '@playwright/test';

/** A browser without the Fullscreen API (L2-144 AC2): `document.fullscreenEnabled` reads false before the app starts. */
export async function withoutFullscreen(page: Page): Promise<void> {
  await page.addInitScript(() =>
    Object.defineProperty(Document.prototype, 'fullscreenEnabled', { get: () => false }),
  );
}

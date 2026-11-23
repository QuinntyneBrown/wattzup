import { type Page, expect } from '@playwright/test';

/**
 * Waits until the app's service worker controls the page and holds every file of its `app` group, as `ngsw.json`
 * lists them: what the browser keeps once the app has been opened (L2-135 AC3). Reads why not, while it waits.
 */
export async function appCached(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          if (!navigator.serviceWorker?.controller) return 'no service worker controls the page';
          const answer = await fetch('/ngsw.json', {
            cache: 'no-store',
            headers: { 'ngsw-bypass': 'true' },
          });
          const manifest = (await answer.json()) as {
            assetGroups: { name: string; urls: string[] }[];
          };
          const urls = manifest.assetGroups.find((group) => group.name === 'app')?.urls ?? [];
          const name = (await caches.keys()).find((key) => key.endsWith(':assets:app:cache'));
          if (urls.length === 0 || name === undefined) return 'no app cache';
          const cache = await caches.open(name);
          const kept = await Promise.all(urls.map((url) => cache.match(url)));
          const missing = kept.filter((response) => response === undefined).length;
          return missing === 0 ? 'cached' : `${missing} of ${urls.length} files not cached yet`;
        }),
      { message: 'the app is cached on the device', timeout: 60_000 },
    )
    .toBe('cached');
}

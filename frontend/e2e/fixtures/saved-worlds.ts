// The worlds a rider's earlier rides left on this device, in the Cache Storage cache the app keeps them in, each file
// with its world's name and bytes (docs/detailed-designs/settings/manage-saved-worlds).
import type { Page } from '@playwright/test';

/** The cache the app keeps worlds in (L2-165). */
export const WORLD_CACHE = 'telo-worlds';

export interface SavedWorldOnDevice {
  readonly id: string;
  readonly name: string;
  readonly bytes: number;
}

/** Prairie Paceline, Old Town Criterium and Cliffside Coast: 61 MB in all, as the Settings mock reads. */
export const THREE_WORLDS: readonly SavedWorldOnDevice[] = [
  { id: 'prairie', name: 'Prairie Paceline', bytes: 18_900_000 },
  { id: 'oldtown', name: 'Old Town Criterium', bytes: 24_300_000 },
  { id: 'coast', name: 'Cliffside Coast', bytes: 17_800_000 },
];

/** Saves the worlds on this device, in order, as earlier rides left them; before Settings opens. */
export async function saveWorlds(page: Page, worlds: readonly SavedWorldOnDevice[]): Promise<void> {
  // Get the app's origin without starting (and then interrupting) Angular's initial navigation.
  await page.goto('/favicon.svg');
  await page.evaluate(
    async ([cacheName, list]) => {
      const cache = await caches.open(cacheName);
      for (const world of list) {
        await cache.put(
          `/worlds/${world.id}/panorama.webp`,
          new Response(new Uint8Array(8), {
            headers: {
              'content-type': 'image/webp',
              'x-telo-world-name': world.name,
              'x-telo-world-bytes': String(world.bytes),
            },
          }),
        );
      }
    },
    [WORLD_CACHE, worlds] as const,
  );
}

/** The paths of the world files this device keeps. */
export async function savedWorldFiles(page: Page): Promise<string[]> {
  return page.evaluate(async (cacheName) => {
    if (!(await caches.has(cacheName))) return [];
    const cache = await caches.open(cacheName);
    return (await cache.keys()).map((request) => new URL(request.url).pathname);
  }, WORLD_CACHE);
}

/** The browser evicts the saved worlds to free space, without asking the app (L2-165 AC4). */
export async function evictWorlds(page: Page): Promise<void> {
  await page.evaluate((cacheName) => caches.delete(cacheName), WORLD_CACHE);
}

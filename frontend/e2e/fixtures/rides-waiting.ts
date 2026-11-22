import type { Page } from '@playwright/test';

/**
 * The ride ids waiting on the device (L2-135 AC1): what the IndexedDB store `rides-waiting` of the database `telo-ride`
 * holds, read from the page, oldest first by when the ride finished. None before the app has kept a ride.
 */
export function ridesWaiting(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    // Opening a database that is not there would make it, empty, before the app could: look first.
    if (!(await indexedDB.databases()).some((db) => db.name === 'telo-ride')) return [];
    return new Promise<string[]>((resolve, reject) => {
      const open = indexedDB.open('telo-ride');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        if (!db.objectStoreNames.contains('rides-waiting')) {
          db.close();
          resolve([]);
          return;
        }
        const all = db.transaction('rides-waiting').objectStore('rides-waiting').getAll();
        all.onerror = () => reject(all.error);
        all.onsuccess = () => {
          db.close();
          const rides = all.result as { rideId: string; finishedAt: string }[];
          resolve(
            rides
              .sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))
              .map((waiting) => waiting.rideId),
          );
        };
      };
    });
  });
}

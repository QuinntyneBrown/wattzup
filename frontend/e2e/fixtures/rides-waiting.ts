import type { Page } from '@playwright/test';

/**
 * The ride ids waiting on the device (L2-135 AC1): what the IndexedDB store `rides-waiting` of the database `telo-ride`
 * holds, read from the page, oldest first by when the ride finished. None before the app has kept a ride.
 */
interface StoredRide {
  rideId: string;
  finishedAt: string;
  attempts: number;
}

export async function ridesWaiting(page: Page): Promise<string[]> {
  return (await storedRides(page)).map((ride) => ride.rideId);
}

export async function storedAttempts(page: Page, rideId: string): Promise<number> {
  return (await storedRides(page)).find((ride) => ride.rideId === rideId)?.attempts ?? 0;
}

function storedRides(page: Page): Promise<StoredRide[]> {
  return page.evaluate(async () => {
    // Opening a database that is not there would make it, empty, before the app could: look first.
    if (!(await indexedDB.databases()).some((db) => db.name === 'telo-ride')) return [];
    return new Promise<StoredRide[]>((resolve, reject) => {
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
          const rides = all.result as StoredRide[];
          resolve(rides.sort((a, b) => a.finishedAt.localeCompare(b.finishedAt)));
        };
      };
    });
  });
}

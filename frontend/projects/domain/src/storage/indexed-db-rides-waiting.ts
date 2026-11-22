import { DestroyRef, Injectable, inject } from '@angular/core';
import type { RidesWaiting, WaitingRide } from '@telo/api';

/** The database Telo Ride keeps on the device, and its store of rides waiting for the backend (L2-135 AC1). */
const DATABASE = 'telo-ride';
const STORE = 'rides-waiting';

/**
 * The rides waiting on the device, in the IndexedDB store `rides-waiting` of the database `telo-ride`, keyed by ride id
 * (docs/detailed-designs/performance/ride-without-a-network). Where IndexedDB cannot be opened (a private window that
 * refuses it), they are kept in memory for the session instead. The database closes when the app does.
 */
@Injectable()
export class IndexedDbRidesWaiting implements RidesWaiting {
  private database: Promise<IDBDatabase | null> | null = null;
  private readonly memory = new Map<string, WaitingRide>();

  constructor() {
    inject(DestroyRef).onDestroy(() => void this.database?.then((db) => db?.close()));
  }

  async oldestFirst(): Promise<readonly WaitingRide[]> {
    const db = await this.open();
    const all = db
      ? await done<WaitingRide[]>(db.transaction(STORE).objectStore(STORE).getAll())
      : [...this.memory.values()];
    return all.sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
  }

  async put(waiting: WaitingRide): Promise<void> {
    const db = await this.open();
    if (db) await committed(db, (store) => store.put(waiting));
    else this.memory.set(waiting.rideId, waiting);
  }

  async remove(rideId: string): Promise<void> {
    const db = await this.open();
    if (db) await committed(db, (store) => store.delete(rideId));
    else this.memory.delete(rideId);
  }

  /** Opens the database once, making its store the first time; `null` where IndexedDB is refused. */
  private open(): Promise<IDBDatabase | null> {
    return (this.database ??= new Promise((resolve) => {
      let request: IDBOpenDBRequest;
      try {
        request = indexedDB.open(DATABASE, 1);
      } catch {
        resolve(null);
        return;
      }
      request.onupgradeneeded = () =>
        request.result.createObjectStore(STORE, { keyPath: 'rideId' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    }));
  }
}

/** Writes to the store and settles once the write is committed, so a ride kept survives the page closing. */
function committed(db: IDBDatabase, write: (store: IDBObjectStore) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    write(transaction.objectStore(STORE));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/** The request's result once it succeeds. */
function done<T>(request: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}

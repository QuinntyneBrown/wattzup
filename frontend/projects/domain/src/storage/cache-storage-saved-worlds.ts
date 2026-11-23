import { Injectable } from '@angular/core';
import { type SavedWorld, type SavedWorlds, type WorldId } from '@telo/api';
import { WORLD_BYTES_HEADER, WORLD_CACHE, WORLD_NAME_HEADER } from './world-cache';

/** A saved world's file: `/worlds/<id>/panorama.webp`. */
const WORLD_FILE = /^\/worlds\/([a-z0-9]+)\/[^/]+$/;

/**
 * `SAVED_WORLDS` on the Cache Storage cache `FetchWorldDownloader` keeps worlds in (L2-165): each file names its world
 * and gives its size in its own headers, so listing reads no file. Clearing deletes the cache. Where Cache Storage is
 * unavailable (an insecure origin) or the cache was never made, nothing is saved, and it never makes one.
 */
@Injectable()
export class CacheStorageSavedWorlds implements SavedWorlds {
  async list(): Promise<readonly SavedWorld[]> {
    if (typeof caches === 'undefined' || !(await caches.has(WORLD_CACHE))) return [];
    const cache = await caches.open(WORLD_CACHE);
    const worlds: SavedWorld[] = [];
    for (const request of await cache.keys()) {
      const id = WORLD_FILE.exec(new URL(request.url).pathname)?.[1] as WorldId | undefined;
      const file = id && (await cache.match(request));
      if (!id || !file) continue;
      const bytes = Number(file.headers.get(WORLD_BYTES_HEADER) ?? NaN);
      worlds.push({
        id,
        name: file.headers.get(WORLD_NAME_HEADER) ?? id,
        bytes: Number.isFinite(bytes) ? bytes : (await file.blob()).size,
      });
    }
    return worlds;
  }

  async clear(): Promise<void> {
    if (typeof caches !== 'undefined') await caches.delete(WORLD_CACHE);
  }
}

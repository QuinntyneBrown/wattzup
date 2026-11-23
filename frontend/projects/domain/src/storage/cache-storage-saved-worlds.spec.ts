// Unit test
// Traces to: L2-165 AC1, AC2, AC4
// Description: the saved worlds are read from the world cache in the order they were saved, each named and sized from
// its file's headers, or sized from the file itself when it was saved before it had them; a cache never made, or one
// the browser evicted, lists nothing and is not made; clearing deletes the cache.
import { CacheStorageSavedWorlds } from './cache-storage-saved-worlds';

/** Cache Storage with the world cache when `files` are given, as Chromium keeps it. */
function fakeCaches(files: readonly [string, Response][] | null) {
  const made: string[] = [];
  const deleted: string[] = [];
  const cache = {
    keys: async () => (files ?? []).map(([path]) => new Request(`http://localhost${path}`)),
    match: async (request: Request) =>
      files?.find(([path]) => new URL(request.url).pathname === path)?.[1].clone(),
  };
  return {
    made,
    deleted,
    storage: {
      has: async (name: string) => name === 'telo-worlds' && files !== null,
      open: async (name: string) => (made.push(name), cache),
      delete: async (name: string) => (deleted.push(name), true),
    },
  };
}

const file = (headers: Record<string, string>, size = 8) =>
  new Response(new Uint8Array(size), { headers });

describe('CacheStorageSavedWorlds', () => {
  const saved = new CacheStorageSavedWorlds();

  afterEach(() => vi.unstubAllGlobals());

  it('lists each saved world in the order it was saved, with its name and size (AC1)', async () => {
    vi.stubGlobal(
      'caches',
      fakeCaches([
        [
          '/worlds/prairie/panorama.webp',
          file({ 'x-telo-world-name': 'Prairie Paceline', 'x-telo-world-bytes': '18900000' }),
        ],
        [
          '/worlds/oldtown/panorama.webp',
          file({ 'x-telo-world-name': 'Old Town Criterium', 'x-telo-world-bytes': '24300000' }),
        ],
      ]).storage,
    );

    await expect(saved.list()).resolves.toEqual([
      { id: 'prairie', name: 'Prairie Paceline', bytes: 18_900_000 },
      { id: 'oldtown', name: 'Old Town Criterium', bytes: 24_300_000 },
    ]);
  });

  it('sizes a file saved before it carried its size from the file, and names it by its id', async () => {
    vi.stubGlobal(
      'caches',
      fakeCaches([['/worlds/coast/panorama.webp', file({ 'content-type': 'image/webp' }, 300)]])
        .storage,
    );

    await expect(saved.list()).resolves.toEqual([{ id: 'coast', name: 'coast', bytes: 300 }]);
  });

  it('lists nothing, and makes no cache, when none was made or the browser evicted it (AC2, AC4)', async () => {
    const storage = fakeCaches(null);
    vi.stubGlobal('caches', storage.storage);

    await expect(saved.list()).resolves.toEqual([]);
    expect(storage.made).toEqual([]);
  });

  it('lists nothing where Cache Storage is unavailable', async () => {
    vi.stubGlobal('caches', undefined);

    await expect(saved.list()).resolves.toEqual([]);
  });

  it('deletes the world cache when cleared (AC2)', async () => {
    const storage = fakeCaches([]);
    vi.stubGlobal('caches', storage.storage);

    await saved.clear();

    expect(storage.deleted).toEqual(['telo-worlds']);
  });
});

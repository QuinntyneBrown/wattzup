// Unit test
// Traces to: L2-152 AC2, AC3; L2-156 AC1, AC2, AC5; L2-165 AC1
// Description: a world's panorama is fetched with its progress in bytes and saved on the device; a saved world resolves
// at once without a request; a download that stops part way is refused with the bytes received, and the next one asks
// for the rest with a Range request and joins the two; offline with nothing saved it is refused at once; a world
// without a panorama has nothing to download.
import { TestBed } from '@angular/core/testing';
import { WorldDownloadError, type WorldDownloadProgress } from '@telo/api';
import { FetchWorldDownloader } from './fetch-world-downloader';

const URL = '/worlds/oldtown/panorama.webp';
const BYTES = new Uint8Array(1000).map((_, i) => i % 251);

/** A response streaming `chunks`, then stopping with an error when `stops`. */
function streamed(
  chunks: readonly Uint8Array[],
  init: { status?: number; length?: number; stops?: boolean } = {},
): Response {
  let index = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      const chunk = chunks[index++];
      if (chunk) controller.enqueue(chunk);
      else if (init.stops) controller.error(new TypeError('network error'));
      else controller.close();
    },
  });
  const headers = new Headers({ 'content-type': 'image/webp' });
  if (init.length !== undefined) headers.set('content-length', String(init.length));
  return new Response(body, { status: init.status ?? 200, headers });
}

/** Cache Storage with one cache, as the test reads it back. */
function fakeCaches() {
  const saved = new Map<string, Uint8Array>();
  const cache = {
    match: async (url: string) =>
      saved.has(url) ? new Response(saved.get(url) as BodyInit) : undefined,
    put: async (url: string, response: Response) =>
      void saved.set(url, new Uint8Array(await response.arrayBuffer())),
  };
  return { saved, storage: { open: async () => cache } };
}

describe('FetchWorldDownloader', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let caches: ReturnType<typeof fakeCaches>;
  let downloader: FetchWorldDownloader;
  let seen: WorldDownloadProgress[];
  const progress = (p: WorldDownloadProgress) => seen.push(p);
  const signal = () => new AbortController().signal;

  beforeEach(() => {
    seen = [];
    fetchMock = vi.fn();
    caches = fakeCaches();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('caches', caches.storage);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    TestBed.configureTestingModule({ providers: [FetchWorldDownloader] });
    downloader = TestBed.inject(FetchWorldDownloader);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches the panorama, reports the bytes received of the total, and saves it on the device', async () => {
    fetchMock.mockResolvedValue(
      streamed([BYTES.subarray(0, 400), BYTES.subarray(400)], { length: 1000 }),
    );

    await expect(downloader.download('oldtown', progress, signal())).resolves.toBe(1000);

    expect(fetchMock).toHaveBeenCalledWith(URL, expect.objectContaining({ headers: {} }));
    expect(seen).toEqual([
      { received: 0, total: 1000 },
      { received: 400, total: 1000 },
      { received: 1000, total: 1000 },
    ]);
    expect(caches.saved.get(URL)).toEqual(BYTES);
  });

  it('resolves a world saved on this device at once, with its size and no request', async () => {
    caches.saved.set(URL, BYTES);

    await expect(downloader.download('oldtown', progress, signal())).resolves.toBe(1000);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(seen).toEqual([{ received: 1000, total: 1000 }]);
  });

  it('refuses a download that stops part way with the bytes received, then resumes from them with a Range request', async () => {
    fetchMock.mockResolvedValueOnce(
      streamed([BYTES.subarray(0, 300)], { length: 1000, stops: true }),
    );

    const stopped = await downloader.download('oldtown', progress, signal()).catch((e) => e);

    expect(stopped).toBeInstanceOf(WorldDownloadError);
    expect(stopped).toMatchObject({
      code: 'download_stopped',
      progress: { received: 300, total: 1000 },
    });

    fetchMock.mockResolvedValueOnce(streamed([BYTES.subarray(300)], { status: 206, length: 700 }));
    seen = [];

    await expect(downloader.download('oldtown', progress, signal())).resolves.toBe(1000);

    expect(fetchMock).toHaveBeenLastCalledWith(
      URL,
      expect.objectContaining({ headers: { Range: 'bytes=300-' } }),
    );
    expect(seen[0]).toEqual({ received: 300, total: 1000 });
    expect(seen.at(-1)).toEqual({ received: 1000, total: 1000 });
    expect(caches.saved.get(URL)).toEqual(BYTES);
  });

  it('refuses a body cut off short of its Content-Length as a stopped download, and resumes it', async () => {
    fetchMock.mockResolvedValueOnce(streamed([BYTES.subarray(0, 600)], { length: 1000 }));

    await expect(downloader.download('oldtown', progress, signal())).rejects.toMatchObject({
      code: 'download_stopped',
      progress: { received: 600, total: 1000 },
    });
    expect(caches.saved.has(URL)).toBe(false);

    fetchMock.mockResolvedValueOnce(streamed([BYTES.subarray(600)], { status: 206, length: 400 }));
    await expect(downloader.download('oldtown', progress, signal())).resolves.toBe(1000);
    expect(caches.saved.get(URL)).toEqual(BYTES);
  });

  it('starts again from the first byte when the server answers a Range request with the whole file', async () => {
    fetchMock.mockResolvedValueOnce(
      streamed([BYTES.subarray(0, 300)], { length: 1000, stops: true }),
    );
    await downloader.download('oldtown', progress, signal()).catch(() => undefined);
    fetchMock.mockResolvedValueOnce(streamed([BYTES], { length: 1000 }));

    await expect(downloader.download('oldtown', progress, signal())).resolves.toBe(1000);

    expect(caches.saved.get(URL)).toEqual(BYTES);
  });

  it('refuses a request that fails before any byte as a stopped download at 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(downloader.download('oldtown', progress, signal())).rejects.toMatchObject({
      code: 'download_stopped',
      progress: { received: 0, total: 0 },
    });
  });

  it('refuses at once, without a request, when the network is down and the world is not saved (L2-156 AC5)', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    await expect(downloader.download('oldtown', progress, signal())).rejects.toMatchObject({
      code: 'offline',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('has nothing to download for a world without a panorama', async () => {
    await expect(downloader.download('southbeach', progress, signal())).resolves.toBe(0);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passes the abort signal to the request, so leaving stops the download', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) => {
          if (init.signal!.aborted) reject(init.signal!.reason);
          init.signal!.addEventListener('abort', () => reject(init.signal!.reason));
        }),
    );

    const download = downloader.download('oldtown', progress, controller.signal);
    controller.abort();

    await expect(download).rejects.toHaveProperty('name', 'AbortError');
  });
});

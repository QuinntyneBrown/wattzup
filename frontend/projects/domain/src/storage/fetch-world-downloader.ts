import { Injectable } from '@angular/core';
import {
  WorldDownloadError,
  type WorldDownloader,
  type WorldDownloadProgress,
  type WorldId,
  panoramaUrl,
} from '@telo/api';

/** The Cache Storage cache the device keeps its worlds in (L2-165). */
export const WORLD_CACHE = 'telo-worlds';

/** What a stopped download had received, kept so the next one resumes from it (L2-156 AC2). */
interface Received {
  readonly chunks: Uint8Array[];
  received: number;
  total: number;
}

/**
 * The `WORLD_DOWNLOADER` the class ride binds: it fetches a world's panorama with the Fetch API, reading the body as it
 * streams to report the bytes received of `Content-Length` (L2-152 AC2), and keeps the finished file in Cache Storage
 * (`telo-worlds`), from which a later load resolves at once (AC3). A download that stops part way keeps what it
 * received for as long as the class ride is open, and the next asks for the rest with `Range` (L2-156 AC2); a server
 * that answers with the whole file starts it again. Offline with nothing saved, it refuses at once (AC5).
 */
@Injectable()
export class FetchWorldDownloader implements WorldDownloader {
  private readonly partial = new Map<string, Received>();

  async download(
    world: WorldId,
    progress: (progress: WorldDownloadProgress) => void,
    signal: AbortSignal,
  ): Promise<number> {
    const url = panoramaUrl(world);
    if (url === null) return 0;
    const cache = await this.cache();
    const saved = await cache?.match(url);
    if (saved) {
      const size = (await saved.arrayBuffer()).byteLength;
      progress({ received: size, total: size });
      return size;
    }
    signal.throwIfAborted();
    const kept = this.partial.get(url) ?? { chunks: [], received: 0, total: 0 };
    if (!navigator.onLine) throw new WorldDownloadError('offline', this.view(kept));
    let response: Response;
    try {
      response = await fetch(url, {
        signal,
        headers: kept.received > 0 ? { Range: `bytes=${kept.received}-` } : {},
      });
      if (response.status !== 200 && response.status !== 206) throw new Error(`${response.status}`);
    } catch (error) {
      if (signal.aborted) throw error;
      throw new WorldDownloadError('download_stopped', this.view(kept));
    }
    if (response.status === 200) {
      kept.chunks.length = 0;
      kept.received = 0;
    }
    const length = Number(response.headers.get('content-length') ?? 0);
    kept.total = kept.received + length;
    this.partial.set(url, kept);
    progress(this.view(kept));
    try {
      const reader = response.body!.getReader();
      for (let read = await reader.read(); !read.done; read = await reader.read()) {
        kept.chunks.push(read.value);
        kept.received += read.value.byteLength;
        progress(this.view(kept));
      }
    } catch (error) {
      if (signal.aborted) throw error;
      throw new WorldDownloadError('download_stopped', this.view(kept));
    }
    // A body shorter than its Content-Length was cut off: it stopped part way.
    if (kept.received < kept.total) {
      throw new WorldDownloadError('download_stopped', this.view(kept));
    }
    this.partial.delete(url);
    const file = new Uint8Array(kept.received);
    let at = 0;
    for (const chunk of kept.chunks) {
      file.set(chunk, at);
      at += chunk.byteLength;
    }
    const type = response.headers.get('content-type') ?? 'application/octet-stream';
    await cache
      ?.put(url, new Response(file, { headers: { 'content-type': type } }))
      .catch(() => undefined);
    return file.byteLength;
  }

  private view(kept: Received): WorldDownloadProgress {
    return { received: kept.received, total: kept.total };
  }

  /** The device's world cache, or `null` where Cache Storage is unavailable (an insecure origin). */
  private async cache(): Promise<Cache | null> {
    if (typeof caches === 'undefined') return null;
    return caches.open(WORLD_CACHE).catch(() => null);
  }
}

import type { AnnouncerVoicePreset } from '@telo/api';

const MAX_CACHED_CLIPS = 30;
const MAX_CACHE_BYTES = 15 * 1024 * 1024;

export interface AiWorkerLike {
  postMessage(message: unknown): void;
  addEventListener(type: 'message' | 'error', listener: (event: MessageEvent) => void): void;
  terminate(): void;
}

export type AiWorkerFactory = () => AiWorkerLike;

export const STATIC_LOBBY_PHRASES: readonly string[] = [
  '3!',
  '2!',
  '1!',
  'GO!',
  'You took the lead!',
  'Final sprint!',
  'Cadence locked!',
];

interface PendingJob {
  resolve(pcm: Float32Array): void;
  reject(error: Error): void;
}

function defaultWorkerFactory(): AiWorkerLike {
  // Allow Playwright fixtures to inject a deterministic FakeAiWorker without external requests (L2-175 AC4).
  const override = (globalThis as Record<string, unknown>)['__teloAiWorkerFactory'] as
    AiWorkerFactory | undefined;
  if (typeof override === 'function') {
    return override();
  }
  return new Worker(new URL('./ai.worker', import.meta.url), { type: 'module' });
}

/**
 * Manages the dedicated AI Web Worker and a bounded in-memory PCM cache (at most 30 clips and
 * 15 MB total) for lobby pre-caching and live synthesis (L2-171 AC1, AC2; L2-173 AC4, AC5).
 */
export class KokoroWorkerClient {
  private worker: AiWorkerLike | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, PendingJob>();
  private readonly cache = new Map<string, Float32Array>();
  private cacheBytes = 0;

  constructor(private readonly createWorker: AiWorkerFactory = defaultWorkerFactory) {}

  get cachedClipCount(): number {
    return this.cache.size;
  }

  get cachedBytes(): number {
    return this.cacheBytes;
  }

  getCached(text: string, voice: AnnouncerVoicePreset): Float32Array | null {
    return this.cache.get(`${voice}:${text}`) ?? null;
  }

  async precache(phrases: readonly string[], voice: AnnouncerVoicePreset): Promise<void> {
    for (const phrase of phrases.slice(0, MAX_CACHED_CLIPS)) {
      if (this.cache.size >= MAX_CACHED_CLIPS) break;
      const key = `${voice}:${phrase}`;
      if (this.cache.has(key)) continue;
      const pcm = await this.synthesize(phrase, voice);
      this.storeCache(key, pcm);
    }
  }

  async synthesize(text: string, voice: AnnouncerVoicePreset): Promise<Float32Array> {
    const cached = this.getCached(text, voice);
    if (cached) return cached;

    const worker = this.ensureWorker();
    const id = this.nextId++;
    return new Promise<Float32Array>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ id, type: 'synthesize', text, voice });
    });
  }

  dispose(): void {
    for (const job of this.pending.values()) {
      job.reject(new Error('worker_disposed'));
    }
    this.pending.clear();
    this.cache.clear();
    this.cacheBytes = 0;
    if (this.worker) {
      try {
        this.worker.postMessage({ id: this.nextId++, type: 'dispose' });
      } catch {
        // Ignore post errors during teardown.
      }
      this.worker.terminate();
      this.worker = null;
    }
  }

  private ensureWorker(): AiWorkerLike {
    if (this.worker) return this.worker;
    const worker = this.createWorker();
    worker.addEventListener('message', (event: MessageEvent) => {
      const data = event.data as { id: number; ok: boolean; pcm?: Float32Array; error?: string };
      const job = this.pending.get(data.id);
      if (!job) return;
      this.pending.delete(data.id);
      if (data.ok && data.pcm) {
        job.resolve(data.pcm);
      } else {
        job.reject(new Error(data.error ?? 'worker_synthesis_failed'));
      }
    });
    worker.addEventListener('error', () => {
      for (const job of this.pending.values()) {
        job.reject(new Error('worker_error'));
      }
      this.pending.clear();
    });
    this.worker = worker;
    return worker;
  }

  private storeCache(key: string, pcm: Float32Array): void {
    const bytes = pcm.byteLength;
    if (bytes > MAX_CACHE_BYTES) return;
    while (
      (this.cache.size >= MAX_CACHED_CLIPS || this.cacheBytes + bytes > MAX_CACHE_BYTES) &&
      this.cache.size > 0
    ) {
      const oldestKey = this.cache.keys().next().value;
      if (!oldestKey) break;
      const oldest = this.cache.get(oldestKey);
      if (oldest) this.cacheBytes -= oldest.byteLength;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, pcm);
    this.cacheBytes += bytes;
  }
}

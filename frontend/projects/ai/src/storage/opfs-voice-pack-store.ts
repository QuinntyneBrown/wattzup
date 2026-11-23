import { signal } from '@angular/core';
import type { VoicePackState, VoicePackStore } from '@telo/api';

export interface VoicePackManifestFile {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface VoicePackManifest {
  readonly version: string;
  readonly files: readonly VoicePackManifestFile[];
}

export interface OpfsDirectoryLike {
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<{
    getFile(): Promise<File>;
    createWritable(): Promise<{
      write(data: Uint8Array): Promise<void>;
      close(): Promise<void>;
    }>;
  }>;
  removeEntry(name: string): Promise<void>;
  entries?(): AsyncIterableIterator<[string, unknown]>;
}

export interface VoicePackStorageAdapter {
  openDirectory(): Promise<OpfsDirectoryLike | null>;
  requestPersist(): Promise<boolean>;
}

const VOICE_PACK_BASE_URL = '/models/voice-announcer';
const VOICE_PACK_DIR = 'voice-announcer';
const MANIFEST_FILE = 'manifest.json';

const ABSENT_STATE: VoicePackState = {
  status: 'absent',
  downloadedBytes: 0,
  totalBytes: 0,
  errorCode: null,
  errorMessage: null,
};

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', copy.buffer);
  return toHex(digest);
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

function defaultStorageAdapter(): VoicePackStorageAdapter {
  return {
    async openDirectory(): Promise<OpfsDirectoryLike | null> {
      const storage = globalThis.navigator?.storage;
      if (!storage || typeof storage.getDirectory !== 'function') return null;
      const root = await storage.getDirectory();
      return (await root.getDirectoryHandle(VOICE_PACK_DIR, {
        create: true,
      })) as unknown as OpfsDirectoryLike;
    },
    async requestPersist(): Promise<boolean> {
      const storage = globalThis.navigator?.storage;
      if (!storage || typeof storage.persist !== 'function') return false;
      try {
        return await storage.persist();
      } catch {
        return false;
      }
    },
  };
}

/**
 * Downloads, SHA-256 verifies, persists in OPFS, and removes the opt-in race announcer voice pack
 * exclusively from `/models/voice-announcer/` on Telo Ride's own origin (L2-168, L2-174).
 */
export class OpfsVoicePackStore implements VoicePackStore {
  private readonly current = signal<VoicePackState>(ABSENT_STATE);
  private readonly freed = signal<number | null>(null);
  private controller: AbortController | null = null;

  readonly state = this.current.asReadonly();
  readonly freedMegabytes = this.freed.asReadonly();

  constructor(
    private readonly fetchFn: typeof fetch = (input, init) => globalThis.fetch(input, init),
    private readonly adapter: VoicePackStorageAdapter = defaultStorageAdapter(),
  ) {}

  async refresh(): Promise<void> {
    try {
      const dir = await this.adapter.openDirectory();
      if (!dir) {
        this.current.set(ABSENT_STATE);
        return;
      }
      const handle = await dir.getFileHandle(MANIFEST_FILE);
      const file = await handle.getFile();
      const manifest = JSON.parse(await file.text()) as VoicePackManifest;
      if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
        this.current.set(ABSENT_STATE);
        return;
      }
      let total = 0;
      for (const entry of manifest.files) {
        const weightHandle = await dir.getFileHandle(entry.path);
        const weightFile = await weightHandle.getFile();
        total += weightFile.size;
      }
      this.current.set({
        status: 'ready',
        downloadedBytes: total,
        totalBytes: total,
        errorCode: null,
        errorMessage: null,
      });
    } catch {
      this.current.set(ABSENT_STATE);
    }
  }

  async download(): Promise<void> {
    if (this.current().status === 'downloading') return;
    this.freed.set(null);

    const dir = await this.adapter.openDirectory();
    if (!dir) {
      this.current.set({
        status: 'error',
        downloadedBytes: 0,
        totalBytes: 0,
        errorCode: 'unsupported',
        errorMessage: 'This browser does not support offline voice pack storage.',
      });
      return;
    }

    const controller = new AbortController();
    this.controller = controller;
    const writtenFiles: string[] = [];

    try {
      this.current.set({
        status: 'downloading',
        downloadedBytes: 0,
        totalBytes: 0,
        errorCode: null,
        errorMessage: null,
      });

      const manifestRes = await this.fetchFn(`${VOICE_PACK_BASE_URL}/${MANIFEST_FILE}`, {
        signal: controller.signal,
      });
      if (!manifestRes.ok) throw new Error('manifest_fetch_failed');
      const manifest = (await manifestRes.json()) as VoicePackManifest;
      const totalBytes = manifest.files.reduce((sum, f) => sum + f.bytes, 0);
      let downloadedBytes = 0;

      this.current.set({
        status: 'downloading',
        downloadedBytes: 0,
        totalBytes,
        errorCode: null,
        errorMessage: null,
      });

      for (const entry of manifest.files) {
        if (entry.path.includes('..') || entry.path.startsWith('/')) {
          throw new Error('integrity_invalid_path');
        }
        const res = await this.fetchFn(`${VOICE_PACK_BASE_URL}/${entry.path}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('weight_fetch_failed');

        const bytes = await this.readStream(res, (delta) => {
          downloadedBytes += delta;
          this.current.set({
            status: 'downloading',
            downloadedBytes,
            totalBytes,
            errorCode: null,
            errorMessage: null,
          });
        });

        const digest = await sha256Hex(bytes);
        if (digest.toLowerCase() !== entry.sha256.toLowerCase()) {
          throw new Error('integrity_mismatch');
        }

        const fileHandle = await dir.getFileHandle(entry.path, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(bytes);
        await writable.close();
        writtenFiles.push(entry.path);
      }

      const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
      const manifestHandle = await dir.getFileHandle(MANIFEST_FILE, { create: true });
      const manifestWritable = await manifestHandle.createWritable();
      await manifestWritable.write(manifestBytes);
      await manifestWritable.close();
      writtenFiles.push(MANIFEST_FILE);

      await this.adapter.requestPersist();

      this.current.set({
        status: 'ready',
        downloadedBytes: totalBytes,
        totalBytes,
        errorCode: null,
        errorMessage: null,
      });
    } catch (error) {
      await this.cleanupFiles(dir, writtenFiles);
      if (controller.signal.aborted) {
        this.current.set(ABSENT_STATE);
      } else if (isQuotaError(error)) {
        this.current.set({
          status: 'error',
          downloadedBytes: 0,
          totalBytes: 0,
          errorCode: 'quota',
          errorMessage: 'Not enough storage on this device.',
        });
      } else if (error instanceof Error && error.message.startsWith('integrity_')) {
        this.current.set({
          status: 'error',
          downloadedBytes: 0,
          totalBytes: 0,
          errorCode: 'integrity',
          errorMessage: 'Voice pack verification failed — try again.',
        });
      } else {
        this.current.set({
          status: 'error',
          downloadedBytes: 0,
          totalBytes: 0,
          errorCode: 'network',
          errorMessage: 'Download interrupted — try again.',
        });
      }
    } finally {
      if (this.controller === controller) this.controller = null;
    }
  }

  cancel(): void {
    this.controller?.abort();
  }

  async remove(): Promise<void> {
    this.cancel();
    const prevBytes = this.current().totalBytes;
    const dir = await this.adapter.openDirectory();
    if (dir) {
      try {
        const handle = await dir.getFileHandle(MANIFEST_FILE);
        const manifest = JSON.parse(await (await handle.getFile()).text()) as VoicePackManifest;
        await this.cleanupFiles(dir, manifest.files.map((f) => f.path).concat(MANIFEST_FILE));
      } catch {
        await this.cleanupFiles(dir, [MANIFEST_FILE]);
      }
    }
    this.current.set(ABSENT_STATE);
    if (prevBytes > 0) {
      this.freed.set(Math.max(1, Math.round(prevBytes / (1024 * 1024))));
    }
  }

  dismissFreed(): void {
    this.freed.set(null);
  }

  private async readStream(res: Response, onChunk: (delta: number) => void): Promise<Uint8Array> {
    if (!res.body) {
      const buf = new Uint8Array(await res.arrayBuffer());
      onChunk(buf.byteLength);
      return buf;
    }
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      length += value.byteLength;
      onChunk(value.byteLength);
    }
    const merged = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return merged;
  }

  private async cleanupFiles(dir: OpfsDirectoryLike, names: readonly string[]): Promise<void> {
    for (const name of names) {
      try {
        await dir.removeEntry(name);
      } catch {
        // Ignore already-absent files during cleanup.
      }
    }
  }
}

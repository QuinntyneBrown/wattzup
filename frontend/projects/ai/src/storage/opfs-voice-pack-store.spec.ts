// Unit test
// Traces to: L2-168 AC1, AC2, AC3, AC4, AC5, AC6, AC7; L2-174 AC1, AC4
import {
  OpfsVoicePackStore,
  type OpfsDirectoryLike,
  type VoicePackManifest,
  type VoicePackStorageAdapter,
} from './opfs-voice-pack-store';

function createMemoryOpfs(): {
  files: Map<string, Uint8Array>;
  persisted: boolean;
  failQuota: boolean;
  adapter: VoicePackStorageAdapter;
} {
  const state = {
    files: new Map<string, Uint8Array>(),
    persisted: false,
    failQuota: false,
    adapter: null as unknown as VoicePackStorageAdapter,
  };
  const dir: OpfsDirectoryLike = {
    async getFileHandle(name, options) {
      if (!state.files.has(name) && !options?.create) {
        throw new DOMException('Not found', 'NotFoundError');
      }
      return {
        async getFile() {
          const data = state.files.get(name);
          if (!data) throw new DOMException('Not found', 'NotFoundError');
          const copy = new Uint8Array(data.byteLength);
          copy.set(data);
          return new File([copy.buffer], name);
        },
        async createWritable() {
          return {
            async write(chunk: Uint8Array) {
              if (state.failQuota) throw new DOMException('Quota exceeded', 'QuotaExceededError');
              state.files.set(name, new Uint8Array(chunk));
            },
            async close() {
              // No-op in memory double.
            },
          };
        },
      };
    },
    async removeEntry(name) {
      state.files.delete(name);
    },
  };
  state.adapter = {
    async openDirectory() {
      return dir;
    },
    async requestPersist() {
      state.persisted = true;
      return true;
    },
  };
  return state;
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

describe('OpfsVoicePackStore (L2-168, L2-174)', () => {
  it('downloads from same-origin, verifies SHA-256, persists in OPFS, and removes cleanly', async () => {
    const opfs = createMemoryOpfs();
    const payload = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const manifest: VoicePackManifest = {
      version: '1.0.0',
      files: [{ path: 'kokoro.onnx', bytes: payload.byteLength, sha256: await sha256(payload) }],
    };
    const requestedUrls: string[] = [];
    const fakeFetch: typeof fetch = async (input) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.endsWith('manifest.json')) {
        return new Response(JSON.stringify(manifest), { status: 200 });
      }
      return new Response(payload, { status: 200 });
    };

    const store = new OpfsVoicePackStore(fakeFetch, opfs.adapter);
    expect(store.state().status).toBe('absent');

    await store.download();

    expect(requestedUrls).toEqual([
      '/models/voice-announcer/manifest.json',
      '/models/voice-announcer/kokoro.onnx',
    ]);
    expect(store.state().status).toBe('ready');
    expect(store.state().totalBytes).toBe(payload.byteLength);
    expect(opfs.persisted).toBe(true);
    expect(opfs.files.has('kokoro.onnx')).toBe(true);

    await store.remove();
    expect(store.state().status).toBe('absent');
    expect(opfs.files.size).toBe(0);
    expect(store.freedMegabytes()).toBe(1);
  });

  it('rejects and deletes corrupted weights on SHA-256 mismatch (L2-174 AC4)', async () => {
    const opfs = createMemoryOpfs();
    const payload = new Uint8Array([9, 9, 9]);
    const manifest: VoicePackManifest = {
      version: '1.0.0',
      files: [{ path: 'kokoro.onnx', bytes: payload.byteLength, sha256: '0'.repeat(64) }],
    };
    const fakeFetch: typeof fetch = async (input) =>
      String(input).endsWith('manifest.json')
        ? new Response(JSON.stringify(manifest), { status: 200 })
        : new Response(payload, { status: 200 });

    const store = new OpfsVoicePackStore(fakeFetch, opfs.adapter);
    await store.download();

    expect(store.state().status).toBe('error');
    expect(store.state().errorCode).toBe('integrity');
    expect(opfs.files.size).toBe(0);
  });

  it('reports quota errors cleanly and deletes partial files (L2-168 AC5)', async () => {
    const opfs = createMemoryOpfs();
    opfs.failQuota = true;
    const payload = new Uint8Array([1, 2, 3]);
    const manifest: VoicePackManifest = {
      version: '1.0.0',
      files: [{ path: 'kokoro.onnx', bytes: payload.byteLength, sha256: await sha256(payload) }],
    };
    const fakeFetch: typeof fetch = async (input) =>
      String(input).endsWith('manifest.json')
        ? new Response(JSON.stringify(manifest), { status: 200 })
        : new Response(payload, { status: 200 });

    const store = new OpfsVoicePackStore(fakeFetch, opfs.adapter);
    await store.download();

    expect(store.state().status).toBe('error');
    expect(store.state().errorCode).toBe('quota');
    expect(store.state().errorMessage).toContain('Not enough storage');
    expect(opfs.files.size).toBe(0);
  });

  it('aborts download and deletes partial files on cancel (L2-168 AC3)', async () => {
    const opfs = createMemoryOpfs();
    const fakeFetch: typeof fetch = async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        );
      });

    const store = new OpfsVoicePackStore(fakeFetch, opfs.adapter);
    const pending = store.download();
    await Promise.resolve();
    store.cancel();
    await pending;

    expect(store.state().status).toBe('absent');
    expect(opfs.files.size).toBe(0);
  });
});

// Unit test
// Traces to: L2-171 AC1, AC2; L2-173 AC4, AC5
import { KokoroWorkerClient, type AiWorkerLike } from './kokoro-worker-client';

function createFakeWorker(): { worker: AiWorkerLike; terminated: () => boolean } {
  let listener: ((event: MessageEvent) => void) | null = null;
  let isTerminated = false;
  const worker: AiWorkerLike = {
    postMessage(msg: unknown) {
      const req = msg as { id: number; type: string };
      if (req.type === 'synthesize') {
        queueMicrotask(() => {
          listener?.({
            data: { id: req.id, ok: true, pcm: new Float32Array(256) },
          } as MessageEvent);
        });
      }
    },
    addEventListener(type, cb) {
      if (type === 'message') listener = cb;
    },
    terminate() {
      isTerminated = true;
    },
  };
  return { worker, terminated: () => isTerminated };
}

describe('KokoroWorkerClient (L2-171, L2-173 AC4, AC5)', () => {
  it('bounds the lobby PCM cache to 30 clips and disposes cleanly', async () => {
    const fake = createFakeWorker();
    const client = new KokoroWorkerClient(() => fake.worker);

    const phrases = Array.from({ length: 40 }, (_, i) => `Phrase ${i}`);
    await client.precache(phrases, 'arcade');

    expect(client.cachedClipCount).toBe(30);
    expect(client.cachedBytes).toBeLessThanOrEqual(15 * 1024 * 1024);
    expect(client.getCached('Phrase 0', 'arcade')).not.toBeNull();

    client.dispose();
    expect(client.cachedClipCount).toBe(0);
    expect(client.cachedBytes).toBe(0);
    expect(fake.terminated()).toBe(true);
  });
});

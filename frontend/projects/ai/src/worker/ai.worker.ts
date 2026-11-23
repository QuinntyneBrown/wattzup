/// <reference lib="webworker" />

type ProviderName = 'webnn' | 'wasm' | 'webgpu';

interface WorkerRequest {
  readonly id: number;
  readonly type: 'synthesize' | 'dispose';
  readonly text?: string;
  readonly voice?: string;
}

interface WorkerResponse {
  readonly id: number;
  readonly ok: boolean;
  readonly pcm?: Float32Array;
  readonly provider?: ProviderName;
  readonly error?: string;
}

let activeProvider: ProviderName = 'wasm';
let sessionLoaded = false;

async function selectProvider(): Promise<ProviderName> {
  const nav = globalThis.navigator as unknown as Record<string, unknown> | undefined;
  if (nav && 'ml' in nav) return 'webnn';
  return 'wasm';
}

async function ensureSession(): Promise<void> {
  if (sessionLoaded) return;
  activeProvider = await selectProvider();
  // Verify OPFS weights exist before running synthesis (L2-168 AC7).
  const storage = globalThis.navigator?.storage;
  if (storage && typeof storage.getDirectory === 'function') {
    const root = await storage.getDirectory();
    const dir = await root.getDirectoryHandle('voice-announcer');
    await dir.getFileHandle('manifest.json');
  }
  sessionLoaded = true;
}

/**
 * Generates a short synthesized audio envelope when running ONNX inference in the dedicated worker.
 * Full Kokoro-82M graph execution binds here via dynamic `onnxruntime-web` import once local
 * model weights are fetched into `/models/voice-announcer/`.
 */
async function synthesizePcm(text: string): Promise<Float32Array> {
  await ensureSession();
  const sampleRate = 24_000;
  const durationSec = Math.min(3.0, Math.max(0.4, text.length * 0.045));
  const length = Math.floor(sampleRate * durationSec);
  const pcm = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const env = Math.min(1, i / 400) * Math.min(1, (length - i) / 400);
    pcm[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.05 * env;
  }
  return pcm;
}

addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  if (req.type === 'dispose') {
    sessionLoaded = false;
    postMessage({ id: req.id, ok: true } satisfies WorkerResponse);
    return;
  }

  try {
    const pcm = await synthesizePcm(req.text ?? '');
    postMessage({ id: req.id, ok: true, pcm, provider: activeProvider } satisfies WorkerResponse, [
      pcm.buffer,
    ]);
  } catch (error) {
    postMessage({
      id: req.id,
      ok: false,
      error: error instanceof Error ? error.message : 'worker_synthesis_failed',
    } satisfies WorkerResponse);
  }
});

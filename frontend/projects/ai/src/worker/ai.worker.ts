/// <reference lib="webworker" />
import { KokoroTTS } from 'kokoro-js';

type ProviderName = 'webnn' | 'wasm' | 'webgpu';
type KokoroVoiceId = 'af_bella' | 'bm_george' | 'af_heart';

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

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

const VOICE_MAP: Record<string, KokoroVoiceId> = {
  arcade: 'af_bella',
  commentator: 'bm_george',
  coach: 'af_heart',
};

let activeProvider: ProviderName = 'wasm';
let ttsPromise: Promise<KokoroTTS> | null = null;

async function selectDevice(): Promise<'wasm' | 'webgpu'> {
  // Prefer WASM SIMD mid-ride to avoid WebGPU contention with Three.js (L2-173 AC2).
  activeProvider = 'wasm';
  return 'wasm';
}

async function getTts(): Promise<KokoroTTS> {
  if (!ttsPromise) {
    ttsPromise = (async () => {
      const device = await selectDevice();
      return KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: 'q8',
        device,
      });
    })();
  }
  return ttsPromise;
}

async function synthesizePcm(text: string, preset?: string): Promise<Float32Array> {
  const tts = await getTts();
  const voice: KokoroVoiceId = VOICE_MAP[preset ?? 'arcade'] ?? 'af_bella';
  const generated = await tts.generate(text, { voice, speed: 1.05 });
  const pcm = new Float32Array(generated.audio.length);
  pcm.set(generated.audio);
  return pcm;
}

addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  if (req.type === 'dispose') {
    ttsPromise = null;
    postMessage({ id: req.id, ok: true } satisfies WorkerResponse);
    return;
  }

  try {
    const pcm = await synthesizePcm(req.text ?? '', req.voice);
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

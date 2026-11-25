/// <reference lib="webworker" />
import { env, InferenceSession, Tensor } from 'onnxruntime-web/wasm';
import { phonemize } from 'phonemizer';

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
  readonly provider?: 'wasm';
  readonly error?: string;
}

interface VoicePack {
  readonly directory: FileSystemDirectoryHandle;
  readonly session: InferenceSession;
  readonly vocabulary: Readonly<Record<string, number>>;
}

const VOICES = {
  arcade: { file: 'af_bella.bin', language: 'en-us' },
  commentator: { file: 'bm_george.bin', language: 'en' },
  coach: { file: 'af_heart.bin', language: 'en-us' },
} as const;
const STYLE_SIZE = 256;
const MAX_PHONEMES = 510;

let voicePack: Promise<VoicePack> | undefined;
const embeddings = new Map<string, Promise<Float32Array>>();

async function file(directory: FileSystemDirectoryHandle, name: string): Promise<File> {
  return (await directory.getFileHandle(name)).getFile();
}

async function openPack(): Promise<VoicePack> {
  const root = await navigator.storage.getDirectory();
  const directory = await root.getDirectoryHandle('voice-announcer');
  await directory.getFileHandle('manifest.json');
  const [model, tokenizer, wasm] = await Promise.all([
    file(directory, 'kokoro.onnx'),
    file(directory, 'tokenizer.json'),
    file(directory, 'ort-wasm-simd-threaded.wasm'),
  ]);
  const {
    model: { vocab: vocabulary },
  } = JSON.parse(await tokenizer.text()) as {
    model: { vocab: Record<string, number> };
  };
  // Supply the installed WASM bytes directly so session creation works offline.
  // https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html
  env.wasm.numThreads = 1;
  env.wasm.wasmBinary = await wasm.arrayBuffer();
  try {
    const session = await InferenceSession.create(await model.arrayBuffer(), {
      executionProviders: ['wasm'],
    });
    return { directory, session, vocabulary };
  } finally {
    env.wasm.wasmBinary = undefined;
  }
}

async function synthesize(text: string, preset: string | undefined): Promise<Float32Array> {
  const { directory, session, vocabulary } = await (voicePack ??= openPack());
  const voice = preset === 'commentator' || preset === 'coach' ? VOICES[preset] : VOICES.arcade;
  let embedding = embeddings.get(voice.file);
  if (!embedding) {
    embedding = file(directory, voice.file).then(
      async (data) => new Float32Array(await data.arrayBuffer()),
    );
    embeddings.set(voice.file, embedding);
  }
  const phones = (await phonemize(text, voice.language)).join(' ');
  // Kokoro discards unknown phonemes and wraps the sequence in token zero.
  const tokens = [...phones]
    .map((phone) => vocabulary[phone])
    .filter((token) => Number.isInteger(token))
    .slice(0, MAX_PHONEMES);
  const input = BigInt64Array.from([0, ...tokens, 0], BigInt);
  const offset = Math.min(tokens.length, MAX_PHONEMES - 1) * STYLE_SIZE;
  const style = (await embedding).slice(offset, offset + STYLE_SIZE);
  const { waveform } = await session.run({
    input_ids: new Tensor('int64', input, [1, input.length]),
    style: new Tensor('float32', style, [1, STYLE_SIZE]),
    speed: new Tensor('float32', [1.05], [1]),
  });
  const pcm = waveform?.data;
  if (!(pcm instanceof Float32Array)) throw new Error('worker_synthesis_failed');
  return new Float32Array(pcm);
}

addEventListener('message', async ({ data: request }: MessageEvent<WorkerRequest>) => {
  if (request.type === 'dispose') {
    const current = voicePack;
    voicePack = undefined;
    embeddings.clear();
    await current?.then(({ session }) => session.release()).catch(() => undefined);
    postMessage({ id: request.id, ok: true } satisfies WorkerResponse);
    return;
  }
  try {
    const pcm = await synthesize(request.text ?? '', request.voice);
    postMessage({ id: request.id, ok: true, pcm, provider: 'wasm' } satisfies WorkerResponse, [
      pcm.buffer,
    ]);
  } catch {
    postMessage({
      id: request.id,
      ok: false,
      error: 'worker_synthesis_failed',
    } satisfies WorkerResponse);
  }
});

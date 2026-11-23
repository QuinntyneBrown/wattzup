import type { Page } from '@playwright/test';

/**
 * Installs a deterministic FakeAiWorker on `window.__teloAiWorkerFactory` so Playwright specs
 * verify race announcer audio/captions cleanly with zero real model downloads or external network
 * requests (L2-175 AC4).
 */
export async function installFakeAiWorker(
  page: Page,
  options: { fail?: boolean } = {},
): Promise<void> {
  await page.addInitScript(({ fail }) => {
    const calls: string[] = [];
    (window as unknown as Record<string, unknown>)['__teloAiWorkerCalls'] = calls;
    (window as unknown as Record<string, unknown>)['__teloAiWorkerFactory'] = () => {
      let onMessage: ((event: MessageEvent) => void) | null = null;
      return {
        postMessage(msg: { id: number; type: string; text?: string }) {
          if (msg.type === 'synthesize') {
            calls.push(msg.text ?? '');
            queueMicrotask(() => {
              if (fail) {
                onMessage?.({
                  data: { id: msg.id, ok: false, error: 'simulated_worker_error' },
                } as MessageEvent);
              } else {
                onMessage?.({
                  data: { id: msg.id, ok: true, pcm: new Float32Array(256) },
                } as MessageEvent);
              }
            });
          }
        },
        addEventListener(type: string, cb: (event: MessageEvent) => void) {
          if (type === 'message') onMessage = cb;
        },
        terminate() {
          // No-op in fake worker.
        },
      };
    };
  }, options);
}

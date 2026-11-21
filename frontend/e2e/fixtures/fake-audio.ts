// Wraps the page's real AudioContext so a spec can see ride sound's graph without analysing the
// audio (L2-129): how many contexts were made, whether one runs, and how many sounds started.
import type { Page } from '@playwright/test';

interface AudioProbe {
  contexts: AudioContext[];
  starts: number;
}

export class FakeAudio {
  constructor(private readonly page: Page) {}

  async install(): Promise<void> {
    await this.page.addInitScript(() => {
      const probe: AudioProbe = { contexts: [], starts: 0 };
      (window as unknown as { __wzAudio: AudioProbe }).__wzAudio = probe;
      const Real = window.AudioContext;
      if (!Real) return;
      window.AudioContext = class extends Real {
        constructor(options?: AudioContextOptions) {
          super(options);
          probe.contexts.push(this);
        }
      };
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args: Parameters<typeof start>) {
        probe.starts++;
        return start.apply(this, args);
      };
    });
  }

  /** How many AudioContexts the page has made. */
  contexts(): Promise<number> {
    return this.page.evaluate(
      () => (window as unknown as { __wzAudio: AudioProbe }).__wzAudio.contexts.length,
    );
  }

  /** Whether any of them is running. */
  running(): Promise<boolean> {
    return this.page.evaluate(() =>
      (window as unknown as { __wzAudio: AudioProbe }).__wzAudio.contexts.some(
        (c) => c.state === 'running',
      ),
    );
  }

  /** How many buffered sounds (ticks and clicks) have been started. */
  starts(): Promise<number> {
    return this.page.evaluate(
      () => (window as unknown as { __wzAudio: AudioProbe }).__wzAudio.starts,
    );
  }
}

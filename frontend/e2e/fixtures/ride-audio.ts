// The audio contexts the page makes (L2-163 AC3): every `new AudioContext()` and every `close()`, counted, so a spec
// can say whether ride sound made one without hearing it.
import type { Page } from '@playwright/test';

interface Counts {
  readonly made: number;
  readonly closed: number;
}

export class RideAudio {
  private constructor(private readonly page: Page) {}

  /** Call before the page loads. */
  static async install(page: Page): Promise<RideAudio> {
    await page.addInitScript(() => {
      const counts = { made: 0, closed: 0 };
      (window as unknown as { __audio: typeof counts }).__audio = counts;
      const Native = window.AudioContext;
      class Counted extends Native {
        constructor(options?: AudioContextOptions) {
          super(options);
          counts.made++;
        }
        override close(): Promise<void> {
          counts.closed++;
          return super.close();
        }
      }
      window.AudioContext = Counted;
    });
    return new RideAudio(page);
  }

  /** How many audio contexts the page has made and closed. */
  counts(): Promise<Counts> {
    return this.page.evaluate(() => ({ ...(window as unknown as { __audio: Counts }).__audio }));
  }
}

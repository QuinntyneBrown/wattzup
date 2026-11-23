import type { Ticker } from '@telo/api';
import type { Subscription } from 'rxjs';

/** A keepalive goes out once this much clock time has passed: a second, less a tick's jitter (L2-016). */
export const KEEPALIVE_MIN_GAP_MS = 900;

/**
 * Writes the Echelon keepalive about once a second while the bike is connected (L2-016). Each tick reads the clock
 * and sends only when a second has passed since the last keepalive, so the rate comes from elapsed time, not from
 * how many ticks arrived: a burst of ticks sends one, and every late tick of a throttled hidden tab sends one.
 */
export class KeepaliveScheduler {
  private ticking: Subscription | null = null;
  private lastSentAt = 0;

  constructor(
    private readonly ticker: Ticker,
    private readonly send: () => Promise<unknown>,
    private readonly onFailure: (error: unknown) => void,
    private readonly now: () => number = Date.now,
  ) {}

  start(): void {
    this.stop();
    this.lastSentAt = this.now();
    this.ticking = this.ticker.seconds.subscribe(() => this.tick());
  }

  stop(): void {
    this.ticking?.unsubscribe();
    this.ticking = null;
  }

  private tick(): void {
    const now = this.now();
    if (now - this.lastSentAt < KEEPALIVE_MIN_GAP_MS) return;
    this.lastSentAt = now;
    this.send().catch((error: unknown) => this.onFailure(error));
  }
}

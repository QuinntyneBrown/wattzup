/** The wait between two attempts to reach a dropped device (L2-017 AC1). */
export const RETRY_MS = 3000;

/**
 * Tries a dropped device again every 3 seconds without the chooser, until an attempt succeeds or `stop()` (L2-017).
 * The wait runs from the end of one attempt to the start of the next, so a slow attempt never overlaps another.
 * `retryNow()` cancels the pending wait and tries at once (the **Reconnect** action).
 */
export class DeviceReconnector {
  private attempt: (() => Promise<boolean>) | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private trying = false;

  start(attempt: () => Promise<boolean>): void {
    this.stop();
    this.attempt = attempt;
    this.wait();
  }

  retryNow(): void {
    if (!this.attempt || this.trying) return;
    clearTimeout(this.timer);
    void this.run();
  }

  stop(): void {
    clearTimeout(this.timer);
    this.attempt = null;
  }

  private wait(): void {
    this.timer = setTimeout(() => void this.run(), RETRY_MS);
  }

  private async run(): Promise<void> {
    const attempt = this.attempt;
    if (!attempt) return;
    this.trying = true;
    const reached = await attempt().catch(() => false);
    this.trying = false;
    if (this.attempt !== attempt) return;
    if (reached) this.attempt = null;
    else this.wait();
  }
}

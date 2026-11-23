/**
 * Every write to the bike, one at a time in the order asked (L2-013 AC3). A write waits while another is pending,
 * and `minGapMs` more after it finishes; each resolves with its acknowledgement time in milliseconds.
 */
export class GattWriteQueue {
  private tail: Promise<unknown> = Promise.resolve();

  enqueue(write: () => Promise<void>, minGapMs = 0): Promise<number> {
    const run = async (): Promise<number> => {
      if (minGapMs > 0) await new Promise((resolve) => setTimeout(resolve, minGapMs));
      const started = Date.now();
      await write();
      return Date.now() - started;
    };
    const next = this.tail.then(run, run);
    this.tail = next.catch(() => undefined);
    return next;
  }
}

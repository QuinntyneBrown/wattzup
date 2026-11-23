// Unit test
// Traces to: L2-013 AC2, AC3
// Description: writes go one at a time in the order asked, a gapped write waits its gap after the one before, and a
// failed write does not stop the next. Vitest's fake clock drives the gaps; nothing sleeps.
import { GattWriteQueue } from './gatt-write-queue';

describe('GattWriteQueue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** A write that stays pending until the test settles it. */
  const pending = () => {
    let settle!: (ok: boolean) => void;
    const done = new Promise<void>(
      (resolve, reject) => (settle = (ok) => (ok ? resolve() : reject(new Error('no')))),
    );
    return { write: () => done, settle };
  };

  it('starts a write only once the one before it has finished', async () => {
    const queue = new GattWriteQueue();
    const started: string[] = [];
    const first = pending();
    void queue.enqueue(() => (started.push('a'), first.write()));
    const second = queue.enqueue(async () => void started.push('b'));

    await vi.advanceTimersByTimeAsync(0);
    expect(started).toEqual(['a']);

    first.settle(true);
    await second;
    expect(started).toEqual(['a', 'b']);
  });

  it('waits the gap after the write before, and not before it is over', async () => {
    const queue = new GattWriteQueue();
    const started: number[] = [];
    void queue.enqueue(async () => void started.push(Date.now()));
    void queue.enqueue(async () => void started.push(Date.now()), 300);
    void queue.enqueue(async () => void started.push(Date.now()), 300);

    await vi.advanceTimersByTimeAsync(299);
    expect(started).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(started).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(300);
    expect(started).toHaveLength(3);
    expect(started[2] - started[1]).toBe(300);
  });

  it('goes on to the next write after one fails', async () => {
    const queue = new GattWriteQueue();
    const failing = pending();
    const first = queue.enqueue(failing.write);
    const second = queue.enqueue(async () => undefined);

    failing.settle(false);

    await expect(first).rejects.toThrow('no');
    await expect(second).resolves.toBeGreaterThanOrEqual(0);
  });
});

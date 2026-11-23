// Unit test
// Traces to: L2-017 AC1 to AC3
// Description: a dropped device is tried every 3 seconds until an attempt succeeds or the reconnector stops; Reconnect
// cancels the wait and tries at once; a slow attempt never overlaps the next. Vitest's fake clock; nothing sleeps.
import { DeviceReconnector, RETRY_MS } from './device-reconnector';

describe('DeviceReconnector', () => {
  let reconnector: DeviceReconnector;
  let attempts: number;
  let succeedOn: number;
  const attempt = async () => ++attempts >= succeedOn;

  beforeEach(() => {
    vi.useFakeTimers();
    reconnector = new DeviceReconnector();
    attempts = 0;
    succeedOn = Infinity;
  });
  afterEach(() => {
    reconnector.stop();
    vi.useRealTimers();
  });

  it('tries every 3 seconds, starting 3 seconds after the drop (AC1)', async () => {
    reconnector.start(attempt);

    await vi.advanceTimersByTimeAsync(RETRY_MS - 1);
    expect(attempts).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(attempts).toBe(1);
    await vi.advanceTimersByTimeAsync(RETRY_MS * 3);
    expect(attempts).toBe(4);
  });

  it('stops trying once an attempt reaches the device (AC2)', async () => {
    succeedOn = 2;
    reconnector.start(attempt);

    await vi.advanceTimersByTimeAsync(RETRY_MS * 10);

    expect(attempts).toBe(2);
  });

  it('tries at once on Reconnect, then waits 3 seconds again (AC3)', async () => {
    reconnector.start(attempt);
    await vi.advanceTimersByTimeAsync(1000);

    reconnector.retryNow();
    await vi.advanceTimersByTimeAsync(0);
    expect(attempts).toBe(1);

    await vi.advanceTimersByTimeAsync(RETRY_MS - 1);
    expect(attempts).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(attempts).toBe(2);
  });

  it('does nothing on Reconnect when nothing is dropped', async () => {
    reconnector.retryNow();
    await vi.advanceTimersByTimeAsync(RETRY_MS * 2);

    expect(attempts).toBe(0);
  });

  it('never starts an attempt while one is still going', async () => {
    let finish!: (reached: boolean) => void;
    const slow = () => (attempts++, new Promise<boolean>((resolve) => (finish = resolve)));
    reconnector.start(slow);
    await vi.advanceTimersByTimeAsync(RETRY_MS);

    reconnector.retryNow();
    await vi.advanceTimersByTimeAsync(RETRY_MS * 3);
    expect(attempts).toBe(1);

    finish(false);
    await vi.advanceTimersByTimeAsync(RETRY_MS);
    expect(attempts).toBe(2);
  });

  it('counts an attempt that throws as a miss, and tries again', async () => {
    reconnector.start(async () => {
      attempts++;
      throw new DOMException('Bluetooth Device is no longer in range.', 'NetworkError');
    });

    await vi.advanceTimersByTimeAsync(RETRY_MS * 2);

    expect(attempts).toBe(2);
  });

  it('stops trying when stopped (the rider ended the ride)', async () => {
    reconnector.start(attempt);
    await vi.advanceTimersByTimeAsync(RETRY_MS);
    reconnector.stop();

    await vi.advanceTimersByTimeAsync(RETRY_MS * 5);

    expect(attempts).toBe(1);
  });
});

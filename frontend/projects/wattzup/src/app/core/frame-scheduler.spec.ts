import { TestBed } from '@angular/core/testing';
import { FrameScheduler } from './frame-scheduler';

/** A fake requestAnimationFrame clock: `refresh(ms)` runs one display refresh `ms` later. */
function fakeFrames() {
  let now = 1000;
  let queue: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queue.push(cb);
    return queue.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    queue = [];
  });
  return {
    refresh(ms: number) {
      now += ms;
      const due = queue;
      queue = [];
      for (const cb of due) cb(now);
    },
    pending: () => queue.length,
  };
}

describe('FrameScheduler.measurePeriod (L2-111 AC9)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ['30 Hz', 1000 / 30],
    ['60 Hz', 1000 / 60],
    ['144 Hz', 1000 / 144],
  ])('measures a %s display over 31 back-to-back frames', async (_, ms) => {
    const frames = fakeFrames();
    const measured = TestBed.inject(FrameScheduler).measurePeriod();
    for (let i = 0; i < 31; i++) frames.refresh(ms);
    await expect(measured).resolves.toBeCloseTo(ms, 6);
    expect(frames.pending()).toBe(0);
  });

  it('runs alongside a draw loop without stopping it', async () => {
    const frames = fakeFrames();
    const scheduler = TestBed.inject(FrameScheduler);
    const stop = scheduler.startLoop();
    const measured = scheduler.measurePeriod();
    for (let i = 0; i < 31; i++) frames.refresh(1000 / 30);
    await expect(measured).resolves.toBeCloseTo(1000 / 30, 6);
    expect(frames.pending()).toBe(1);
    stop();
  });
});

describe('FrameScheduler.nextFrame (L2-111 AC10)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('resolves on the next frame, and asks for no frame after it', async () => {
    const frames = fakeFrames();
    let next = false;
    void TestBed.inject(FrameScheduler)
      .nextFrame()
      .then(() => (next = true));
    await Promise.resolve();
    expect(next).toBe(false);
    frames.refresh(1000 / 60);
    await Promise.resolve();
    expect(next).toBe(true);
    expect(frames.pending()).toBe(0);
  });
});

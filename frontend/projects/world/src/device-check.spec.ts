// Unit test
// Traces to: L2-162 AC2, AC6
import type { DeviceCheckProgress, WorldRenderer, WorldStartOptions } from '@telo/api';
import { type CheckFrames, WorldDeviceCheck, trialMs } from './device-check';

/** A renderer that records how each trial starts it, and whether it was let go. */
class FakeRenderer implements WorldRenderer {
  readonly backend = 'webgl2' as const;
  options: WorldStartOptions | undefined;
  draws = 0;
  disposed = false;
  constructor(private readonly starts = true) {}
  start(
    _canvas: HTMLCanvasElement,
    _world: unknown,
    _nextFrame: unknown,
    _segments: unknown,
    options?: WorldStartOptions,
  ): Promise<boolean> {
    this.options = options;
    return Promise.resolve(this.starts);
  }
  resize(): void {
    /* not needed */
  }
  draw(): void {
    this.draws++;
  }
  setFramePeriod(): void {
    /* not needed */
  }
  pauseBudget(): void {
    /* not needed */
  }
  stream(): void {
    /* not needed */
  }
  dispose(): void {
    this.disposed = true;
  }
}

/**
 * A 60 Hz display whose frames come `steps[i]` ms apart while the i-th trial runs; `stall` stops the frames, as a
 * hidden tab's.
 */
function check(steps: number[], { starts = true, stall = false } = {}) {
  let now = 0;
  const renderers: FakeRenderer[] = [];
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  const frames: CheckFrames = {
    measurePeriod: () => Promise.resolve(1000 / 60),
    nextFrame: () => {
      if (stall && renderers[0]!.draws >= 3) return new Promise<void>(() => undefined);
      now += steps[renderers.length - 1] ?? 16;
      return Promise.resolve();
    },
  };
  const load = () => {
    const renderer = new FakeRenderer(starts);
    renderers.push(renderer);
    return Promise.resolve(renderer);
  };
  return { runner: new WorldDeviceCheck(frames, load, 300), renderers };
}

function options(
  levels = ['high', 'medium', 'low'] as const,
  signal = new AbortController().signal,
) {
  const progress: DeviceCheckProgress[] = [];
  return {
    progress,
    run: {
      levels,
      forceWebGL: false,
      progress: (p: DeviceCheckProgress) => progress.push(p),
      signal,
    },
  };
}

afterEach(() => vi.restoreAllMocks());

describe('WorldDeviceCheck (L2-162)', () => {
  it('stops at the first level whose frames hold the display rate', async () => {
    const { runner, renderers } = check([16]);
    const { run, progress } = options();
    expect(await runner.run(run)).toEqual({ level: 'high', displayFps: 60, tried: [] });
    expect(renderers).toHaveLength(1);
    expect(renderers[0]!.options).toEqual({ tier: 'high', stepDown: false, forceWebGL: false });
    expect(renderers[0]!.disposed).toBe(true);
    expect(progress[0]).toEqual({ level: 'high', secondsLeft: 1, percent: 0, tried: [] });
  });

  it('moves down a level when frames are slow, reporting what the level held', async () => {
    const { runner, renderers } = check([30, 16]);
    const { run, progress } = options();
    expect(await runner.run(run)).toEqual({
      level: 'medium',
      displayFps: 60,
      tried: [{ level: 'high', fps: 33 }],
    });
    expect(renderers.map((r) => [r.options?.tier, r.disposed])).toEqual([
      ['high', true],
      ['medium', true],
    ]);
    const medium = progress.filter((p) => p.level === 'medium');
    expect(medium[0]).toEqual({
      level: 'medium',
      secondsLeft: 1,
      percent: 33,
      tried: [{ level: 'high', fps: 33 }],
    });
    expect(medium.at(-1)!.percent).toBe(66);
  });

  it('holds a frame within 1.2 × the period, and not one beyond it', async () => {
    expect((await check([20]).runner.run(options().run))?.level).toBe('high');
    vi.restoreAllMocks();
    expect((await check([21, 16]).runner.run(options().run))?.level).toBe('medium');
  });

  it('settles on Low when no level holds', async () => {
    const { runner } = check([40, 35, 30]);
    expect(await runner.run(options().run)).toEqual({
      level: 'low',
      displayFps: 60,
      tried: [
        { level: 'high', fps: 25 },
        { level: 'medium', fps: 29 },
        { level: 'low', fps: 33 },
      ],
    });
  });

  it('stopped mid-trial, even with no frame coming, lets the renderer go and finds nothing', async () => {
    const { runner, renderers } = check([16], { stall: true });
    const abort = new AbortController();
    const { run } = options(['high', 'medium', 'low'], abort.signal);
    const result = runner.run(run);
    await vi.waitFor(() => expect(renderers[0]?.draws).toBe(3));
    abort.abort();
    expect(await result).toBeNull();
    expect(renderers).toHaveLength(1);
    expect(renderers[0]!.disposed).toBe(true);
  });

  it('finds nothing and lets the renderer go when no world can be drawn', async () => {
    const { runner, renderers } = check([16], { starts: false });
    expect(await runner.run(options().run)).toBeNull();
    expect(renderers[0]!.disposed).toBe(true);
  });

  it.each([
    [undefined, 30_000],
    [{ trialSeconds: 2 }, 2_000],
    [{ trialSeconds: 0 }, 30_000],
    [{ trialSeconds: '2' }, 30_000],
  ])('with the hook %j rides each trial %i ms', (hook, ms) => {
    expect(trialMs(hook)).toBe(ms);
  });
});

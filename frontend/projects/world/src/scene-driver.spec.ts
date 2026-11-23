import type { SceneFrame, TimedSegment, WorldRenderer } from '@telo/api';
import { SceneDriver, type SceneInput } from './scene-driver';

class FakeRenderer implements WorldRenderer {
  readonly backend = 'webgl2' as const;
  readonly frames: SceneFrame[] = [];
  start(): Promise<boolean> {
    return Promise.resolve(true);
  }
  resize(): void {
    /* not needed */
  }
  draw(frame: SceneFrame): void {
    this.frames.push(frame);
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
    /* not needed */
  }
}

const segments: TimedSegment[] = [
  { kind: 'steady', start: 0, duration: 600, level: 10, cadenceAim: 80 },
];
const input = (change: Partial<SceneInput> = {}): SceneInput => ({
  segments,
  elapsed: 100,
  speedKmh: 36,
  running: true,
  reducedMotion: false,
  ...change,
});

describe('SceneDriver (L2-110)', () => {
  it('moves the rider at speed_kmh while running', () => {
    const renderer = new FakeRenderer();
    const driver = new SceneDriver(renderer);
    driver.frame(1000, input());
    driver.frame(1100, input());
    // 36 km/h is 10 m/s; 0.1 s later the rider is 1 m on.
    expect(renderer.frames.map((f) => f.s)).toEqual([0, 1]);
  });

  it('holds the rider still while not running', () => {
    const renderer = new FakeRenderer();
    const driver = new SceneDriver(renderer);
    driver.frame(1000, input({ running: false }));
    driver.frame(2000, input({ running: false }));
    expect(renderer.frames.map((f) => f.s)).toEqual([0, 0]);
  });

  it('steps no more than a quarter second after a hidden tab', () => {
    const renderer = new FakeRenderer();
    const driver = new SceneDriver(renderer);
    driver.frame(0, input());
    driver.frame(60_000, input());
    expect(renderer.frames[1]!.s).toBeCloseTo(2.5, 9);
  });

  it('passes the plan, the moment and reduced motion to the renderer', () => {
    const renderer = new FakeRenderer();
    new SceneDriver(renderer).frame(0, input({ reducedMotion: true, speedKmh: null }));
    expect(renderer.frames[0]).toEqual(
      expect.objectContaining({ segments, elapsed: 100, speedKmh: 0, reducedMotion: true }),
    );
  });

  describe('the scene time moving parts ride by (#897)', () => {
    /** Frames 100 ms apart, each with the engine's whole-second `elapsed` of that moment. */
    const run = (elapsedAt: (ms: number) => number, until: number, running = true) => {
      const renderer = new FakeRenderer();
      const driver = new SceneDriver(renderer);
      for (let ms = 0; ms <= until; ms += 100) {
        driver.frame(ms, input({ elapsed: elapsedAt(ms), running }));
      }
      return renderer.frames.map((f) => f.time);
    };

    it('advances by each frame time, not in the engine’s whole seconds', () => {
      const times = run((ms) => 100 + Math.floor(ms / 1000), 3000);
      for (let i = 1; i < times.length; i++) {
        expect(times[i]! - times[i - 1]!).toBeCloseTo(0.1, 9);
      }
    });

    it.each([
      ['starts at the ride’s elapsed', 0, 100],
      ['stays within the second the engine is in', 900, 100.9],
      ['follows the engine into its next second', 1000, 101],
      ['keeps going smoothly through that second', 1500, 101.5],
    ])('%s', (_, at, expected) => {
      const times = run((ms) => 100 + Math.floor(ms / 1000), at);
      expect(times.at(-1)).toBeCloseTo(expected, 9);
    });

    it('never runs a second past the engine when its ticks are late', () => {
      const times = run(() => 100, 3000);
      expect(Math.max(...times)).toBeLessThanOrEqual(101);
    });

    it('catches up at once when the engine is ahead, as after a hidden tab', () => {
      const times = run((ms) => (ms < 500 ? 100 : 160), 500);
      expect(times.at(-1)).toBeCloseTo(160, 9);
    });

    it('holds still while the ride is not running', () => {
      const times = run(() => 100, 1000, false);
      expect(new Set(times)).toEqual(new Set([100]));
    });
  });
});

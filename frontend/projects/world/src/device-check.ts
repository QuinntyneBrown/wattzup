// The device check (L2-162): new in Telo Ride, since `main` has no off-screen trial. Built on `main`'s renderer, its
// tiers and frame budget, its frame scheduler and scene driver, and the held-rate measure World loading's warm-up uses.
import type { Injector } from '@angular/core';
import type {
  DeviceCheck,
  DeviceCheckOptions,
  DeviceCheckOutcome,
  DeviceCheckTrial,
  WorldRendererLoader,
  WorldTier,
} from '@telo/api';
import { FrameScheduler } from './frame-scheduler';
import { heldFps } from './held-fps';
import { worldForMap } from './map-world';
import { SceneDriver } from './scene-driver';
import { loadWorldRenderer } from './world-renderer-loader';

/** About 30 seconds of the test world at each level (L2-162 AC2). */
const TRIAL_MS = 30_000;
/** A level holds the display's rate when its median frame is within the frame budget's 1.2 × the period (L2-159 AC4). */
const SLOW = 1.2;
/** The test world: Old Town, the same at every level, ridden at an easy pace. */
const TEST_WORLD = 'oldtown';
const SPEED_KMH = 30;
/** The test-only hook a spec shortens each trial with (`window.__wzDeviceCheck = { trialSeconds }`), as `main`'s
 * probe pins a tier (#672). */
const HOOK_KEY = '__wzDeviceCheck';

/** The trial length in ms: the hook's, when a spec set a positive number of seconds, else 30 seconds. */
export function trialMs(hook: unknown): number {
  const seconds = (hook as { trialSeconds?: unknown } | null | undefined)?.trialSeconds;
  return typeof seconds === 'number' && seconds > 0 ? seconds * 1000 : TRIAL_MS;
}

/** What the check needs of `main`'s frame scheduler: the display's period, and one frame at a time. */
export type CheckFrames = Pick<FrameScheduler, 'measurePeriod' | 'nextFrame'>;

/** Thrown into the awaited frame when the rider stops the check or hides the tab (AC6). */
class Stopped extends Error {}

/**
 * Rides the test world off screen at each level from the top the graphics API allows, and stops at the first whose
 * median frame holds the display's rate (L2-162 AC2). Each trial has its own renderer on a canvas in no document,
 * sized to the display, started at the level with step-down off, and disposed when the trial ends, the rider stops the
 * check or the tab is hidden (AC6). No level held: Low.
 */
export class WorldDeviceCheck implements DeviceCheck {
  constructor(
    private readonly frames: CheckFrames,
    private readonly load: WorldRendererLoader,
    private readonly trial = trialMs((globalThis as Record<string, unknown>)[HOOK_KEY]),
  ) {}

  async run({
    levels,
    forceWebGL,
    progress,
    signal,
  }: DeviceCheckOptions): Promise<DeviceCheckOutcome | null> {
    const stopped = new Promise<never>((_, reject) => {
      const stop = () => reject(new Stopped());
      if (signal.aborted) stop();
      else signal.addEventListener('abort', stop, { once: true });
    });
    stopped.catch(() => undefined);
    const until = <T>(next: Promise<T>) => Promise.race([next, stopped]);
    try {
      const period = await until(this.frames.measurePeriod());
      const displayFps = Math.round(1000 / period);
      const tried: DeviceCheckTrial[] = [];
      for (const [i, level] of levels.entries()) {
        const report = (ms: number) =>
          progress({
            level,
            secondsLeft: Math.max(1, Math.ceil((this.trial - ms) / 1000)),
            percent: Math.floor(((i + Math.min(ms / this.trial, 1)) / levels.length) * 100),
            tried: [...tried],
          });
        report(0);
        const fps = await this.ride(
          level,
          forceWebGL,
          () => until(this.frames.nextFrame()),
          report,
        );
        if (fps === null) return null;
        if (1000 / fps <= SLOW * period) return { level, displayFps, tried };
        tried.push({ level, fps });
      }
      return { level: 'low', displayFps, tried };
    } catch (error) {
      if (error instanceof Stopped) return null;
      throw error;
    }
  }

  /** One trial: the rate the level held, or null when no world could be drawn. */
  private async ride(
    level: WorldTier,
    forceWebGL: boolean,
    nextFrame: () => Promise<void>,
    report: (ms: number) => void,
  ): Promise<number | null> {
    const renderer = await this.load();
    try {
      const canvas = document.createElement('canvas');
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      const started = await renderer.start(canvas, worldForMap(TEST_WORLD), nextFrame, [], {
        tier: level,
        stepDown: false,
        forceWebGL,
      });
      if (!started) return null;
      renderer.resize(innerWidth, innerHeight, devicePixelRatio);
      const driver = new SceneDriver(renderer);
      const times: number[] = [];
      for (;;) {
        await nextFrame();
        const now = performance.now();
        const ms = times.length > 0 ? now - times[0]! : 0;
        driver.frame(now, {
          segments: [],
          elapsed: Math.floor(ms / 1000),
          speedKmh: SPEED_KMH,
          running: true,
          reducedMotion: false,
        });
        times.push(now);
        report(ms);
        if (ms >= this.trial) return heldFps(times);
      }
    } finally {
      renderer.dispose();
    }
  }
}

/** The device check on `main`'s frame scheduler and renderer, for the ride app's `DEVICE_CHECK` loader. */
export function deviceCheck(injector: Injector): DeviceCheck {
  return new WorldDeviceCheck(injector.get(FrameScheduler), loadWorldRenderer);
}

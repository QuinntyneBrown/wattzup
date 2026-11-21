// The contract the World Ride scene draws through (ADR 0020). The real renderer is Three.js in
// world-renderer.ts, loaded on demand; tests reach a fake through the same contract.
import { InjectionToken } from '@angular/core';
import type { Segment } from '@wattzup/api';
import type { World } from './worlds';

/** What the renderer draws in one frame (L2-110). */
export interface SceneFrame {
  /** Metres the rider has ridden in the scene. */
  readonly s: number;
  /** The pedals' angle, in radians. */
  readonly crank: number;
  readonly segments: readonly Segment[];
  /** The ride's `elapsed_seconds`, whole seconds as the engine counts them. */
  readonly elapsed: number;
  /**
   * The scene time moving parts are placed by, in seconds: it follows `elapsed` but advances by
   * each frame's own time, so they move smoothly rather than once a second (#897).
   */
  readonly time: number;
  readonly speedKmh: number;
  /** No camera sway and no turning pedals (L2-110 AC6). */
  readonly reducedMotion: boolean;
}

export interface WorldRenderer {
  /**
   * Starts drawing `world` on `canvas` with WebGPU, else WebGL2; resolves false when neither
   * starts (L2-110 AC4, L2-111 AC1, ADR 0021). Before it resolves, the scene is drawn over a few
   * frames, each awaited through `nextFrame`, so its programs compile while it loads (AC10), and
   * the ride's own frame is rehearsed at the start of `segments` (#882).
   */
  start(
    canvas: HTMLCanvasElement,
    world: World,
    nextFrame: () => Promise<void>,
    segments?: readonly Segment[],
  ): Promise<boolean>;
  resize(width: number, height: number, pixelRatio: number): void;
  draw(frame: SceneFrame): void;
  /** Judges frames against the display's measured frame period from now on (L2-111 AC4, AC9). */
  setFramePeriod(ms: number): void;
  /** Judges no frame until the next `setFramePeriod`: the period is being measured (AC9). */
  pauseBudget(): void;
  dispose(): void;
}

/** Loads a renderer: the real one imports Three.js only when World Ride opens (L2-102 AC8). */
export type WorldRendererLoader = () => Promise<WorldRenderer>;

export const WORLD_RENDERER = new InjectionToken<WorldRendererLoader>('WORLD_RENDERER');

// The test-only World Ride hook (#672), for the performance sweep only: the behaviour specs never
// use it. `pin(tier)` sets `window.__wzWorldRide = { tier }` before the app boots. World Ride then
// draws at that tier from its first frame, its frame budget never lowers it, and the renderer
// writes what it draws to `__wzWorldRide.report`, which `report()` reads. Ultra on a WebGL2
// screen draws at high, as L2-111 AC2 says.
//
// It is not a rider option: nothing in the app sets the global, and the README lists no such
// option. Only the lazy World Ride renderer reads it (core/world-ride-probe.ts).
import type { Page } from '@playwright/test';

export type Tier = 'low' | 'medium' | 'high' | 'ultra';

/** What the renderer reports while the hook is set. */
export interface WorldRideReport {
  tier: Tier;
  backend: 'webgpu' | 'webgl2';
  /** The time between each drawn frame and the one before, in ms, oldest first. */
  frames: number[];
  /** GPU time of each frame, in ms, from timer queries; null where the browser offers none. */
  gpuMs: number[] | null;
  /** Draw calls in the latest frame, every pass included. */
  drawCalls: number;
  /** Shader programs alive. */
  programs: number;
  /** Shader programs alive when the scene had loaded, before its first frame. */
  programsBeforeRide: number | null;
  /** The scene's distinct materials by type and features, most shared first. */
  materials: Record<string, number>;
  /** Materials in the scene that should follow the bend but do not (L2-111 AC8). */
  unbent: number;
  /** Whether the post chain draws the ink outline pass (L2-111 technique 52). */
  outlines: boolean;
  /** Whether the sky is the flat three-stop gradient (L2-111 technique 53). */
  skyGradient: boolean;
  /** Materials cut by the ordered dither (L2-111 technique 54). */
  dithered: number;
}

export class WorldRideProbe {
  constructor(private readonly page: Page) {}

  /**
   * Call before the page loads: World Ride draws at `tier` and never drops it; with `webgl2`,
   * through three's WebGL2 backend even where WebGPU is offered.
   */
  async pin(tier: Tier, backend: 'auto' | 'webgl2' = 'auto'): Promise<void> {
    await this.page.addInitScript(
      ([t, b]) => {
        (window as unknown as Record<string, unknown>)['__wzWorldRide'] = { tier: t, backend: b };
      },
      [tier, backend] as const,
    );
  }

  /** The renderer's latest report, or null before the scene has started. */
  async report(): Promise<WorldRideReport | null> {
    return this.page.evaluate(
      () =>
        ((window as unknown as Record<string, { report?: WorldRideReport }>)['__wzWorldRide']
          ?.report ?? null) as WorldRideReport | null,
    );
  }
}

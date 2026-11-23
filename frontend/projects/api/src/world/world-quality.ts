import type { WorldTier } from './world-renderer';

/** How the rider's World settings ask a world to be drawn (L2-159, L2-160, L2-161). */
export interface WorldQuality {
  /** The level a world opens at; null opens at Low, as Auto does (L2-159 AC4, AC5). */
  readonly tier: WorldTier | null;
  /** Whether slow frames lower the level (L2-160 AC1, AC2). */
  readonly stepDown: boolean;
  /** The most frames a second the world draws; null matches the display (L2-160 AC4). */
  readonly frameCapFps: number | null;
  /** The share of the drawing buffer's pixels across, 0.5 to 1 (L2-160 AC5). */
  readonly renderScale: number;
  /** Draws with WebGL 2 even where WebGPU is offered (L2-161 AC1). */
  readonly forceWebGL: boolean;
}

/** The recommended World settings, as a world reads them: Auto at the display's rate and full resolution. */
export const AUTO_QUALITY: WorldQuality = {
  tier: null,
  stepDown: true,
  frameCapFps: null,
  renderScale: 1,
  forceWebGL: false,
};

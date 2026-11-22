import type { WorldTier } from '@telo/api';

/** The quality levels from the lowest, as `main`'s render-quality.ts orders its tiers. */
const LEVELS: readonly WorldTier[] = ['low', 'medium', 'high', 'ultra'];

const below = (tier: WorldTier): WorldTier | null => LEVELS[LEVELS.indexOf(tier) - 1] ?? null;

/**
 * Starts the world at `tier`, stepping down a level each time a program fails to build (L2-156 AC3). `attempt` resolves
 * true when the world started at that level, false where no 3D starts at all, and rejects when a program fails to
 * build. Resolves the level the world started at, or `null` for the panorama: below Low, with no 3D, or once `signal`
 * says World loading has gone.
 */
export async function startStepping(
  tier: WorldTier,
  attempt: (tier: WorldTier) => Promise<boolean>,
  signal: AbortSignal,
): Promise<WorldTier | null> {
  for (let level: WorldTier | null = tier; level; level = below(level)) {
    try {
      return (await attempt(level)) ? level : null;
    } catch {
      if (signal.aborted) return null;
    }
  }
  return null;
}

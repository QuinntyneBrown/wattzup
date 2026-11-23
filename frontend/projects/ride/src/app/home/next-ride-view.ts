import type { MapDto, NextRideView, ProgressDto } from '@telo/api';
import { formatBest } from '@telo/components';

/**
 * The Next ride card's words for the map the backend offers (L2-033): its tag, the next unlock's goal as the catalogue
 * words it, with the levels still to climb for a level goal (AC4), and the map it opens; with every map open, one more
 * star on the offered map and no reward (AC5); and the rider's best there in minutes, or none (AC3). Nothing while the
 * offered map is missing from the catalogue.
 */
export function nextRideView(progress: ProgressDto, maps: readonly MapDto[]): NextRideView | null {
  const offered = maps.find((map) => map.id === progress.nextRideMapId);
  if (!offered) return null;
  const unlock = maps.find((map) => map.id === progress.nextUnlockId) ?? null;
  const best = progress.bestTimeSeconds[offered.id];
  return {
    mapId: offered.id,
    name: offered.name,
    photoUrl: offered.photoUrl,
    tag: `${offered.name} · ${offered.distanceKm} km · ${offered.rating}`,
    goal: unlock
      ? goal(unlock, progress.level)
      : `Earn ${moreStars(progress, offered)}★ on ${offered.name}`,
    opens: unlock
      ? { name: unlock.name, place: unlock.place, thumbnailUrl: unlock.thumbnailUrl }
      : null,
    best: best === undefined ? null : formatBest(best),
  };
}

/** The catalogue's goal; a level goal adds the levels still to climb. */
function goal(unlock: MapDto, level: number): string {
  const words = unlock.unlockGoal ?? '';
  const target = unlock.unlockLevel;
  return target == null ? words : `${words} · ${Math.max(0, target - level)} to go`;
}

/** One more star than the map holds, up to three. */
function moreStars(progress: ProgressDto, map: MapDto): number {
  return Math.min(3, (progress.stars[map.id] ?? 0) + 1);
}

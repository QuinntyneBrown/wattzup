import type { MapDto, MapProgressDto } from '@telo/api';

/** One map's tile in the Race door. */
export interface RaceDoorTile {
  readonly mapId: string;
  readonly name: string;
  readonly photoUrl: string;
  readonly stars: number;
  readonly locked: boolean;
}

/** The Race door's counts and tiles. */
export interface RaceDoorView {
  readonly openMaps: number;
  readonly maps: number;
  readonly stars: number;
  readonly allStars: number;
  readonly tiles: readonly RaceDoorTile[];
}

/** How many tiles the Race door shows: the first maps in unlock order (L2-034 AC2). */
const TILES = 4;

/** Stars a map can hold (L2-039). */
const STARS_PER_MAP = 3;

/**
 * The Race door (L2-034): the open maps of all maps, the stars earned of three per map, and a tile for each of the
 * first four maps in unlock order, open or locked, with its stars.
 */
export function raceDoorView(progress: MapProgressDto, maps: readonly MapDto[]): RaceDoorView {
  const open = new Set(progress.openMapIds);
  return {
    openMaps: maps.filter((map) => open.has(map.id)).length,
    maps: maps.length,
    stars: maps.reduce((sum, map) => sum + (progress.stars[map.id] ?? 0), 0),
    allStars: maps.length * STARS_PER_MAP,
    tiles: maps.slice(0, TILES).map((map) => ({
      mapId: map.id,
      name: map.name,
      photoUrl: map.thumbnailUrl,
      stars: progress.stars[map.id] ?? 0,
      locked: !open.has(map.id),
    })),
  };
}

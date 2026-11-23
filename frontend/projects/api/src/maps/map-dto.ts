import type { Plan, SegmentKind } from '../workout/plan';

/** How hard a map rides (L2-045 AC1). */
export type MapRating = 'Easy' | 'Moderate' | 'Hard' | 'Brutal';

/**
 * One map of the catalogue as `GET /api/maps` serves it (ADR 0029): its facts, its world, its thumbnail and its Race
 * Setup photo in the app, the goal that opens it, or `null` for a map open from the start (L2-040 AC6), and the map that
 * goal is earned on, or `null` for a level goal (L2-047 AC3); and, for the race, its 30:00 plan and its world's terrain
 * (L2-045 AC2); and the real place it follows, which a rider may stream as photorealistic 3D Tiles, or `null` (L2-066).
 */
export interface MapDto {
  readonly id: string;
  readonly name: string;
  readonly routeName: string | null;
  readonly place: string;
  readonly distanceKm: number;
  readonly climbingM: number;
  readonly rating: MapRating;
  readonly world: string;
  readonly thumbnailUrl: string;
  readonly photoUrl: string;
  readonly unlockGoal: string | null;
  readonly unlockMapId: string | null;
  /** The level a level goal asks for (L2-033 AC4); absent from a catalogue this device cached before, which counts as none. */
  readonly unlockLevel?: number | null;
  readonly plan: Plan;
  readonly terrain: MapTerrain;
  /** Absent from a catalogue this device cached before maps carried it, which counts as none. */
  readonly realPlace?: RealPlace | null;
}

/**
 * The real place a map follows (L2-066): its name ("Bruges"), the stretch the route rides ("Steenstraat to the Markt")
 * and the latitude and longitude, in degrees, the tiles centre on.
 */
export interface RealPlace {
  readonly name: string;
  readonly route: string;
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * A map's world as its road climbs (from `main`'s `worlds.ts`): the grade in percent the road eases towards for each
 * segment kind of the plan, and the rolling grade laid over it.
 */
export interface MapTerrain {
  readonly grade: Readonly<Record<SegmentKind, number>>;
  readonly roll: number;
}

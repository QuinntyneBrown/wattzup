/**
 * The rider's maps as the backend computes them (L2-040, L2-041, L2-044): the maps open to them, the next unlock, and
 * the stars and best time, in seconds, of each map ridden.
 */
export interface MapProgressDto {
  readonly openMapIds: readonly string[];
  readonly nextUnlockId: string | null;
  readonly stars: Readonly<Record<string, number>>;
  readonly bestTimeSeconds: Readonly<Record<string, number>>;
}

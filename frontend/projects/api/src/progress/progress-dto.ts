import type { MapProgressDto } from './map-progress-dto';

/**
 * The rider's standing from `GET /api/progress` (docs/detailed-designs/home/show-the-app-header): their level, total XP
 * and the next level's threshold, `null` at level 30 (L2-038), their streak in days (L2-042), their maps (L2-040,
 * L2-041), the map Home's Next ride card offers (L2-033) and the map a ride opened that Home has not announced yet
 * (L2-036), and the rides and kilometres Profile counts (L2-109).
 */
export interface ProgressDto extends MapProgressDto {
  readonly level: number;
  readonly totalXp: number;
  readonly nextLevelXp: number | null;
  readonly streakDays: number;
  readonly nextRideMapId: string;
  readonly unseenUnlockId: string | null;
  /** The rides the backend has recorded for the rider (L2-109). */
  readonly rideCount: number;
  /** The kilometres those rides covered, to the nearest whole. */
  readonly distanceKm: number;
}

/** The header's level link (L2-032 AC2): the badge's level, the XP label, the accessible name and the bar's fill. */
export interface LevelView {
  readonly level: number;
  /** "1,840 / 2,600 XP". */
  readonly label: string;
  /** "Level 7, 1840 of 2600 XP". */
  readonly ariaLabel: string;
  /** From 0 to 100. */
  readonly fillPercent: number;
}

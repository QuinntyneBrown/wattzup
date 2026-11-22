import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { PackStrengthId, RaceMode } from '../race/race-mode';

/** Which door a ride came through. */
export type RideKind = 'race' | 'class' | 'custom';

/**
 * What every finished ride says of itself (docs/detailed-designs/progression/keep-progress-on-the-backend): the ride id
 * the app gave it when it started, its whole seconds, the metres its speeds add up to, its output in kJ, its highest
 * power and speed, the speed in km/h of each second ridden, so the backend can check the distance (L2-125 AC2), when
 * it finished and the device's IANA time zone.
 */
export interface RideFacts {
  readonly rideId: string;
  readonly elapsedSeconds: number;
  readonly distanceMeters: number;
  readonly outputKj: number;
  readonly maxPowerWatts: number;
  readonly maxSpeedKmh: number;
  /** The share of running seconds within 10 % of target power, from 0 to 1, to three decimals (L2-037 AC3). */
  readonly onTargetShare: number;
  readonly speedSamplesKmh: readonly number[];
  /** ISO 8601, in UTC. */
  readonly finishedAt: string;
  readonly timeZoneId: string;
}

/** A finished race: its map, whom it was against, and the rider's place among the field. */
export interface RaceRideFacts {
  readonly kind: 'race';
  readonly mapId: string;
  readonly mode: RaceMode;
  /** The bots' pack strength; none in a solo or riders-online race. */
  readonly pack: PackStrengthId | null;
  readonly place: number;
  readonly fieldSize: number;
  /**
   * A riders-online race's session, whose result the backend takes the place, field, time and output from instead
   * (L2-125 AC1); none otherwise.
   */
  readonly sessionId?: string;
}

/** A finished class. */
export interface ClassRideFacts {
  readonly kind: 'class';
  readonly classId: string;
}

/** A finished custom workout (docs/detailed-designs/custom-workout/leave-or-end-a-custom-ride): no map or class. */
export interface CustomRideFacts {
  readonly kind: 'custom';
}

/** A finished ride as the app submits it: facts only, never XP, stars or unlocks, which the backend computes (L2-044 AC4). */
export type SubmitRideRequest = RideFacts & (RaceRideFacts | ClassRideFacts | CustomRideFacts);

/** One line of a ride's XP, as Results shows it: "2 of 10" +160 (L2-037). */
export interface XpLineDto {
  readonly kind: 'finished' | 'place' | 'podium' | 'onTarget' | 'streak';
  readonly label: string;
  readonly xp: number;
}

/** A race's stars on its map: how many of the three the rider holds, and how many this ride earned (L2-075). */
export interface MapStarsDto {
  readonly held: number;
  readonly earned: number;
}

/** A race's best time on its map, the best before it (none on a first finish), and whether this ride set it (L2-077). */
export interface PersonalBestDto {
  readonly bestSeconds: number;
  readonly previousBestSeconds: number | null;
  readonly isNewBest: boolean;
}

/**
 * What the backend answers for a recorded ride, the same for every repeat of its ride id (L2-125 AC3): its XP line by
 * line and in all, the rider's total XP once it was added (L2-037), the level it reaches, whether the ride took it
 * there, and the next level's threshold and the XP to it, both `null` at level 30 (L2-038); for a race, its stars and
 * best time on the map, both `null` for a class.
 */
export interface RideRecordedDto {
  readonly rideId: string;
  readonly recordedAt: string;
  readonly xpLines: readonly XpLineDto[];
  readonly xpTotal: number;
  readonly totalXp: number;
  readonly level: number;
  readonly levelUp: boolean;
  readonly nextLevelXp: number | null;
  readonly xpToNextLevel: number | null;
  readonly stars: MapStarsDto | null;
  readonly best: PersonalBestDto | null;
  /** The map the ride opened, if any (L2-040 AC5). */
  readonly openedMapId: string | null;
}

/**
 * The rider's finished rides: `POST /api/rides`, recorded once for its ride id (L2-044 AC2). A ride no one could ride
 * is refused with 422 `ride_not_plausible` (L2-125 AC2).
 */
export interface RidesApi {
  submitRide(ride: SubmitRideRequest): Observable<RideRecordedDto>;
}

export const RIDES_API = new InjectionToken<RidesApi>('RIDES_API');

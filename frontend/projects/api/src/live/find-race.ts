import { RideHubError } from './join-class-session';

/**
 * One seat of a race session's start grid as the ride hub sends it (L2-052): its number, its kind, and for a taken seat
 * the name, jersey, level (none for a bot) and whether they are ready. The service knows no country yet (L2-052 AC2).
 */
export interface RaceSeatDto {
  readonly number: number;
  readonly kind: 'rider' | 'bot' | 'open';
  readonly name: string | null;
  readonly jersey: string | null;
  readonly level: number | null;
  readonly country: string | null;
  readonly ready: boolean;
}

/** What the ride hub answers to FindRace: a seat (`code` null) or a refusal's code. */
export interface FindRaceResult {
  readonly code: string | null;
  readonly sessionId: string | null;
  readonly startsAt: string | null;
  readonly seat: number | null;
  readonly seats: readonly RaceSeatDto[];
}

/** The rider's seat in a race session (L2-121 AC1): the session, its start as server time (ISO), the seat and the grid. */
export interface RaceSeatAssignment {
  readonly sessionId: string;
  readonly startsAt: string;
  readonly seat: number;
  readonly seats: readonly RaceSeatDto[];
}

/** A race session's grid after a change (L2-055 AC3), with the name of a rider whose seat is open again (AC1). */
export interface SeatsChanged {
  readonly sessionId: string;
  readonly seats: readonly RaceSeatDto[];
  readonly left: string | null;
}

/** The seat the hub gave, or the refusal as a `RideHubError` (`map_not_found`). */
export function raceSeatFrom(result: FindRaceResult): RaceSeatAssignment {
  if (
    result.code === null &&
    result.sessionId !== null &&
    result.startsAt !== null &&
    result.seat !== null
  )
    return {
      sessionId: result.sessionId,
      startsAt: result.startsAt,
      seat: result.seat,
      seats: result.seats,
    };
  throw new RideHubError('map_not_found', null);
}

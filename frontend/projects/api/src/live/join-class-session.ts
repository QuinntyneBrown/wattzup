/** A session offered instead of the one refused: the next one (L2-122 AC2, L2-086 AC3). */
export interface OfferedSession {
  readonly id: string;
  readonly startsAt: string;
}

/** What the ride hub answers to JoinClassSession: a seat (`code` null) or a refusal's code. */
export interface JoinClassSessionResult {
  readonly code: string | null;
  readonly sessionId: string;
  readonly startsAt: string | null;
  readonly jersey: string | null;
  readonly next: OfferedSession | null;
}

/** The rider's seat in a group session: its start as server time (ISO) and the seat's jersey. */
export interface SeatAssignment {
  readonly sessionId: string;
  readonly startsAt: string;
  readonly jersey: string;
}

/** The codes a join is refused with; a screen branches on them. */
export type RideHubErrorCode =
  'session_full' | 'session_started' | 'class_locked' | 'session_not_found';

/** A refused join (L2-122 AC2, L2-086 AC3, L2-082): its code and the session offered instead, when there is one. */
export class RideHubError extends Error {
  constructor(
    readonly code: RideHubErrorCode,
    readonly next: OfferedSession | null,
  ) {
    super(`The ride hub refused the join: ${code}`);
    this.name = 'RideHubError';
  }
}

const CODES: readonly string[] = [
  'session_full',
  'session_started',
  'class_locked',
  'session_not_found',
];

/** The seat the hub gave, or the refusal as a `RideHubError`; a code the app does not know reads as `session_not_found`. */
export function seatFrom(result: JoinClassSessionResult): SeatAssignment {
  if (result.code === null && result.startsAt !== null && result.jersey !== null) {
    return { sessionId: result.sessionId, startsAt: result.startsAt, jersey: result.jersey };
  }
  const code = CODES.includes(result.code ?? '')
    ? (result.code as RideHubErrorCode)
    : 'session_not_found';
  throw new RideHubError(code, result.next);
}

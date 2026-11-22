/**
 * One rider on a riders-online race's board, as the hub sends it (L2-123 AC3): the place, the seat (which finds the
 * rider's own row), the name others see, the jersey token suffix, the level (none for a bot), whether a person or a bot
 * rides it, the metres ridden, the seconds behind the leader and its status.
 */
export interface RaceStandingRow {
  readonly position: number;
  readonly seat: number;
  readonly name: string;
  readonly jersey: string;
  readonly level: number | null;
  readonly kind: 'person' | 'bot';
  readonly distanceMetres: number;
  readonly gapSeconds: number;
  /** Riding, finished (held at the line) or DNF: left, silent 15 seconds or gone 30 (L2-124). */
  readonly status: 'riding' | 'finished' | 'dnf';
}

/** A race session's standings, ranked, as every rider in it receives them once a second (`RaceStandingsUpdated`). */
export interface RaceStandings {
  readonly sessionId: string;
  readonly rows: readonly RaceStandingRow[];
}

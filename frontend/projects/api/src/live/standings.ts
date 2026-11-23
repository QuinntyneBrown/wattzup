/**
 * One rider on a live session's board, as the hub sends it (L2-123 AC3): the place, the name others see, the jersey
 * token suffix (`nova` reads `--jersey-nova`), the level (none for a bot), whether a person or a bot rides it, the
 * output in kJ and the kJ behind the leader.
 */
export interface StandingRow {
  readonly position: number;
  readonly name: string;
  readonly jersey: string;
  readonly level: number | null;
  readonly kind: 'person' | 'bot';
  readonly outputKj: number;
  readonly gapKj: number;
}

/** A live session's standings, ranked, as every rider in it receives them once a second (`StandingsUpdated`). */
export interface Standings {
  readonly sessionId: string;
  readonly rows: readonly StandingRow[];
}

/** One row of the final standings as Results draws it (L2-073 AC3): the place, the rider, the bot marker and the time. */
export interface StandingsRow {
  readonly place: number;
  readonly name: string;
  /** The jersey's colour token suffix: `nova` reads `--jersey-nova`. */
  readonly jersey: string;
  readonly bot: boolean;
  readonly you: boolean;
  /** "26:32". */
  readonly value: string;
}

/** An opponent's place on the route at one second of the race. */
export interface FieldPosition {
  readonly id: string;
  readonly name: string;
  /** The opponent's jersey, a design-system jersey name (`flint`, `ghost`). */
  readonly jersey: string;
  readonly bot: boolean;
  /** Metres ridden. */
  readonly metres: number;
}

/** The race's opponents (docs/detailed-designs/race/race-the-ghost-and-bots): where each is at a second of the race. */
export interface RaceField {
  /** The field at whole second `second` of the race clock; seconds must not go back. */
  advance(second: number): readonly FieldPosition[];
}

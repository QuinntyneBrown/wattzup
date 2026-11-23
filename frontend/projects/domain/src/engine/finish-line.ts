import type { FieldPosition } from './race-field';

/**
 * The race's finish line, at the map's distance (docs/detailed-designs/race/finish-a-race, L2-071): it holds each rider
 * at the line from the second they first reach it, and keeps that second for the placing. One entry per rider, so it
 * never grows past the field.
 */
export class FinishLine {
  private readonly crossed = new Map<string, number>();

  constructor(readonly metres: number) {}

  /** The seconds each rider reached the line at, by id. */
  get crossings(): ReadonlyMap<string, number> {
    return this.crossed;
  }

  /** A rider's distance held at the line, noting the second they first reach it. */
  hold(id: string, metres: number, second: number): number {
    if (metres < this.metres) return metres;
    if (!this.crossed.has(id)) this.crossed.set(id, second);
    return this.metres;
  }

  /** The field at `second`, each rider held at the line. */
  holdAll(field: readonly FieldPosition[], second: number): FieldPosition[] {
    return field.map((rider) => ({ ...rider, metres: this.hold(rider.id, rider.metres, second) }));
  }
}

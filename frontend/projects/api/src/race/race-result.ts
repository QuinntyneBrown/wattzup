import type { PackStrengthId, RaceMode } from './race-mode';

/**
/** One rider of a race's final standings (L2-073 AC3): the rider among them as `you`, the bots marked. */
export interface ResultStanding {
  readonly name: string;
  readonly jersey: string;
  readonly bot: boolean;
  readonly you: boolean;
  /** Whole seconds of the race clock at the line, measured or, for a rider still riding, estimated from their gap. */
  readonly finishTimeS: number;
}

/**
 * A finished race's result, which the race hands to Results in the navigation's state (docs/detailed-designs/race/
 * finish-a-race, L2-071 AC1, AC3; docs/detailed-designs/results/show-results): the map, whom it was against, the finish
 * time on the race clock, the rider's place where they crossed the line among the field, and the final standings.
 */
export interface RaceResult {
  readonly mapId: string;
  readonly mapName: string;
  readonly mode: RaceMode;
  /** The bots' pack strength; none in a solo race. */
  readonly pack: PackStrengthId | null;
  /** Whole seconds of the race clock at the line. */
  readonly finishTimeS: number;
  /** 1 for the winner. */
  readonly place: number;
  /** Riders in the race, the rider among them. */
  readonly field: number;
  /** Every rider in the order they finished; a solo race's has the rider and the ghost. */
  readonly standings: readonly ResultStanding[];
}

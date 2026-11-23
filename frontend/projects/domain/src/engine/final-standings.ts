import type { ResultStanding } from '@telo/api';
import { type Standing, YOU } from './standings';

/**
 * The final standings when the rider crosses the line (L2-073 AC3): every rider in the order they finished, each with a
 * finish time. A rider who crossed first finishes at the second they crossed (`crossings`, by id); one still riding
 * finishes at the rider's time plus their gap behind, rounded to the second.
 */
export function finalStandings(
  standings: readonly Standing[],
  crossings: ReadonlyMap<string, number>,
  finishTimeS: number,
): ResultStanding[] {
  return standings.map(({ id, name, jersey, bot, you, gap }) => ({
    name,
    jersey,
    bot,
    you,
    finishTimeS: id === YOU ? finishTimeS : (crossings.get(id) ?? Math.round(finishTimeS - gap)),
  }));
}

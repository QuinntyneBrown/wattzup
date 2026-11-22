import type { RaceSeatAssignment, RaceStandings } from '@telo/api';
import { type Standing, YOU } from '@telo/domain';

/**
 * A riders-online race's board from the service's standings (L2-123 AC3, L2-060 AC1, AC2): the places as the service
 * ranked them, the rider's row found by seat (a rider and a bot can share a jersey) as "You", and each gap the rider's
 * gap to the leader less the row's, so a rider ahead is positive. Before the first standings, the start grid by seat
 * with every gap level; before a seat, nothing.
 */
export function liveRaceStandings(
  standings: RaceStandings | null,
  race: RaceSeatAssignment | null,
): Standing[] {
  if (race === null) return [];
  const mine = (seat: number) => seat === race.seat;
  if (standings === null)
    return race.seats
      .filter((seat) => seat.kind !== 'open')
      .map((seat, i) => ({
        id: mine(seat.number) ? YOU : `seat-${seat.number}`,
        name: mine(seat.number) ? 'You' : (seat.name ?? ''),
        jersey: mine(seat.number) ? 'you' : (seat.jersey ?? ''),
        bot: seat.kind === 'bot',
        you: mine(seat.number),
        place: i + 1,
        gap: 0,
      }));
  const yours = standings.rows.find((row) => mine(row.seat))?.gapSeconds ?? 0;
  return standings.rows.map((row) => ({
    id: mine(row.seat) ? YOU : `seat-${row.seat}`,
    name: mine(row.seat) ? 'You' : row.name,
    jersey: mine(row.seat) ? 'you' : row.jersey,
    bot: row.kind === 'bot',
    you: mine(row.seat),
    place: row.position,
    gap: mine(row.seat) ? 0 : yours - row.gapSeconds,
  }));
}

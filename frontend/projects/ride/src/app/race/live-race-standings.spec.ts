// Unit test
// Traces to: L2-123 AC3; L2-060 AC1, AC2; L2-124
// Description: a riders-online race's board is the service's standings: its places, the rider's row found by seat and
// named "You", and each gap the rider's gap to the leader less the row's. Before the first standings the board lists
// the start grid by seat, every gap level.
import type { RaceSeatAssignment, RaceStandingRow, RaceStandings } from '@telo/api';
import { liveRaceStandings } from './live-race-standings';

const seat = (number: number, kind: 'rider' | 'bot' | 'open', name: string | null) => ({
  number,
  kind,
  name,
  jersey: name === null ? null : name.toLowerCase().replace('pacer ', ''),
  level: kind === 'rider' ? 4 : null,
  country: null,
  ready: true,
});

const RACE: RaceSeatAssignment = {
  sessionId: 'old-town-criterium@20261122T180030Z',
  startsAt: '2026-11-22T18:00:30Z',
  seat: 2,
  seats: [
    seat(1, 'rider', 'lena.k'),
    seat(2, 'rider', 'quinn'),
    seat(3, 'open', null),
    seat(4, 'bot', 'Pacer Nova'),
  ],
};

const row = (
  position: number,
  seatNumber: number,
  name: string,
  gapSeconds: number,
  status: RaceStandingRow['status'] = 'riding',
): RaceStandingRow => ({
  position,
  seat: seatNumber,
  name,
  jersey: name.toLowerCase().replace('pacer ', ''),
  level: name.startsWith('Pacer') ? null : 4,
  kind: name.startsWith('Pacer') ? 'bot' : 'person',
  distanceMetres: 1_000 - gapSeconds * 6,
  gapSeconds,
  status,
});

describe('liveRaceStandings', () => {
  it("ranks as the service did, the rider's row by seat, each gap the rider's to the leader less the row's", () => {
    const standings: RaceStandings = {
      sessionId: RACE.sessionId,
      rows: [row(1, 4, 'Pacer Nova', 0), row(2, 2, 'quinn', 3.4), row(3, 1, 'lena.k', 7)],
    };

    expect(liveRaceStandings(standings, RACE)).toEqual([
      {
        id: 'seat-4',
        name: 'Pacer Nova',
        jersey: 'nova',
        bot: true,
        you: false,
        place: 1,
        gap: 3.4,
      },
      { id: 'you', name: 'You', jersey: 'you', bot: false, you: true, place: 2, gap: 0 },
      {
        id: 'seat-1',
        name: 'lena.k',
        jersey: 'lena.k',
        bot: false,
        you: false,
        place: 3,
        gap: expect.closeTo(-3.6, 6),
      },
    ]);
  });

  it('marks a row the service marked DNF (L2-124)', () => {
    const standings: RaceStandings = {
      sessionId: RACE.sessionId,
      rows: [row(1, 2, 'quinn', 0), row(2, 4, 'Pacer Nova', 1), row(3, 1, 'lena.k', 9, 'dnf')],
    };

    expect(liveRaceStandings(standings, RACE).map((each) => each.dnf ?? false)).toEqual([
      false,
      false,
      true,
    ]);
  });

  it('lists the start grid by seat, every gap level, before the first standings', () => {
    expect(liveRaceStandings(null, RACE)).toEqual([
      { id: 'seat-1', name: 'lena.k', jersey: 'lena.k', bot: false, you: false, place: 1, gap: 0 },
      { id: 'you', name: 'You', jersey: 'you', bot: false, you: true, place: 2, gap: 0 },
      { id: 'seat-4', name: 'Pacer Nova', jersey: 'nova', bot: true, you: false, place: 3, gap: 0 },
    ]);
  });

  it('has no board before the rider holds a seat', () => {
    expect(liveRaceStandings(null, null)).toEqual([]);
  });
});

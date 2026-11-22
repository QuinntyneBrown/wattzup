/**
 * Race sessions as the ride hub sends them (backend/src/Telo.Ride.Application/Races/RaceDtos.cs): the answer to
 * FindRace and each SeatsChanged. The service knows no rider's country, so every country is null (L2-052 AC2).
 */
export interface RaceSeat {
  readonly number: number;
  readonly kind: 'rider' | 'bot' | 'open';
  readonly name: string | null;
  readonly jersey: string | null;
  readonly level: number | null;
  readonly country: null;
  readonly ready: boolean;
}

/** The session every lobby spec rides: Old Town Criterium's. */
export const RACE_SESSION = 'old-town-criterium@20261122T180030Z';

export const rider = (
  number: number,
  name: string,
  jersey: string,
  level: number,
  ready = false,
): RaceSeat => ({
  number,
  kind: 'rider',
  name,
  jersey,
  level,
  country: null,
  ready,
});

export const open = (number: number): RaceSeat => ({
  number,
  kind: 'open',
  name: null,
  jersey: null,
  level: null,
  country: null,
  ready: false,
});

export const bot = (number: number, name: string): RaceSeat => ({
  number,
  kind: 'bot',
  name: `Pacer ${name}`,
  jersey: name.toLowerCase(),
  level: null,
  country: null,
  ready: true,
});

/**
 * The Race Lobby mock's default grid (docs/mocks/pages/race-lobby/default.html): five riders online, all ready, then
 * the rider, who joined last, in seat 6 at level 7, and four open seats.
 */
export const lobbyOfSix: readonly RaceSeat[] = [
  rider(1, 'lena.k', 'lena', 4, true),
  rider(2, 'MarcoVelo', 'marco', 11, true),
  rider(3, 'priya_spins', 'priya', 18, true),
  rider(4, 'jwatts', 'jwatts', 7, true),
  rider(5, 'Ollie R.', 'ollie', 14, true),
  rider(6, 'quinn', 'kenji', 7),
  open(7),
  open(8),
  open(9),
  open(10),
];

/** What FindRace answers: the session, its start as server time, the rider's seat and the grid. */
export const found = (startsAt: number, seat: number, seats: readonly RaceSeat[]) => ({
  code: null,
  sessionId: RACE_SESSION,
  startsAt: new Date(startsAt).toISOString(),
  seat,
  seats,
});

/** A SeatsChanged message: the grid, with the name of a rider who left and whose seat is open again. */
export const seatsChanged = (seats: readonly RaceSeat[], left: string | null = null) => ({
  sessionId: RACE_SESSION,
  seats,
  left,
});

/** The grid with seat `number` replaced. */
export const withSeat = (seats: readonly RaceSeat[], seat: RaceSeat): RaceSeat[] =>
  seats.map((each) => (each.number === seat.number ? seat : each));

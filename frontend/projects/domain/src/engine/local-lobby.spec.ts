import { LOBBY_SEATS, LocalLobby } from './local-lobby';

describe('LocalLobby', () => {
  it('seats You at the rider level, then the nine bots in list order (L2-052 AC1, AC3)', () => {
    const seats = LocalLobby.seats(7, false);

    expect(seats).toHaveLength(LOBBY_SEATS);
    expect(seats[0]).toEqual({
      kind: 'you',
      name: 'You',
      jersey: 'you',
      meta: 'Lv 7',
      ready: false,
    });
    expect(seats.slice(1).map((seat) => seat.name)).toEqual(
      ['Nova', 'Rook', 'Juno', 'Atlas', 'Kite', 'Vale', 'Moss', 'Flint', 'Echo'].map(
        (name) => `Pacer ${name}`,
      ),
    );
    expect(seats[1]).toEqual({
      kind: 'bot',
      name: 'Pacer Nova',
      jersey: 'nova',
      meta: 'Bot',
      ready: false,
    });
  });

  it('readies every bot with the rider (L2-053 AC3)', () => {
    expect(LocalLobby.seats(1, true).every((seat) => seat.ready)).toBe(true);
    expect(LocalLobby.seats(1, false).some((seat) => seat.ready)).toBe(false);
  });
});

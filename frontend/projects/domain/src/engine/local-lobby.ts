import type { LobbySeat } from '@telo/api';
import { BOT_NAMES } from './bot-pace-model';

/** A race's start grid always has ten seats (L2-052 AC1, L2-054 AC3). */
export const LOBBY_SEATS = 10;

/** A bots lobby's clock runs from 0:05 once the rider is ready (L2-053 AC3). */
export const BOTS_LOBBY_SECONDS = 5;

/**
 * The rules of a bots lobby (docs/detailed-designs/race/wait-in-the-race-lobby), which runs in the browser alone: seat
 * 1 is You at the rider's level, seats 2 to 10 the nine bots in list order, Pacer Nova to Pacer Echo, each "Bot" in the
 * jersey of its name (L2-052 AC1, AC3). The bots are ready once the rider is (L2-053 AC3).
 */
export const LocalLobby = {
  seats(level: number, ready: boolean): readonly LobbySeat[] {
    return [
      { kind: 'you', name: 'You', jersey: 'you', meta: `Lv ${level}`, ready },
      ...BOT_NAMES.map((name): LobbySeat => ({
        kind: 'bot',
        name: `Pacer ${name}`,
        jersey: name.toLowerCase(),
        meta: 'Bot',
        ready,
      })),
    ];
  },
};

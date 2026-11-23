import type { PackStrengthId } from '@telo/api';
import { SeededRandom, fnv1a } from './seeded-random';

/** The bot list, in the order the race draws them (docs/detailed-designs/race/race-the-ghost-and-bots). */
export const BOT_NAMES = [
  'Nova',
  'Rook',
  'Juno',
  'Atlas',
  'Kite',
  'Vale',
  'Moss',
  'Flint',
  'Echo',
] as const;
export type BotName = (typeof BOT_NAMES)[number];

/** The pack strength's base power in watts (L2-067 AC1). */
export const PACK_BASE_WATTS: Readonly<Record<PackStrengthId, number>> = {
  easy: 130,
  medium: 190,
  hard: 250,
};

/** One bot's own pace: its steady drift and its swing's size, period and phase. */
export interface BotPace {
  readonly name: BotName;
  readonly base: number;
  readonly drift: number;
  readonly swing: number;
  readonly period: number;
  readonly phase: number;
}

/**
 * The pace model (L2-067 AC1): each bot rides `base + drift + swing × sin(2πt ÷ period + phase)` watts, its drift in
 * ±12 % of the pack's base, its swing 4 to 10 % of it over 45 to 150 seconds. The draws come from a generator seeded
 * with "mapId:pack", nine bots in the list's order, so the same map and pack draw the same race.
 */
export const BotPaceModel = {
  paces(mapId: string, pack: PackStrengthId): BotPace[] {
    const random = new SeededRandom(fnv1a(`${mapId}:${pack}`));
    const base = PACK_BASE_WATTS[pack];
    return BOT_NAMES.map((name) => ({
      name,
      base,
      drift: base * random.between(-0.12, 0.12),
      swing: base * random.between(0.04, 0.1),
      period: random.between(45, 150),
      phase: random.between(0, 2 * Math.PI),
    }));
  },

  /** The bot's power in watts at second `t`. */
  watts(pace: BotPace, t: number): number {
    return (
      pace.base + pace.drift + pace.swing * Math.sin((2 * Math.PI * t) / pace.period + pace.phase)
    );
  },
} as const;

import type { PackStrengthId } from '@telo/api';
import { type BotPace, BotPaceModel } from './bot-pace-model';
import type { FieldPosition, RaceField } from './race-field';
import { VirtualSpeedModel } from './virtual-speed-model';

/**
 * The nine bots of a bots race (L2-067 AC1): each second a bot rides the virtual speed of its pace model's power, the
 * rider's model, so its distance is the sum of its speed second by second. Seconds a hidden tab skipped are ridden
 * one by one, so a late tick lands where an on-time one would.
 */
export class BotPack implements RaceField {
  private readonly paces: readonly BotPace[];
  private readonly metres: number[];
  private second = 0;

  constructor(mapId: string, pack: PackStrengthId) {
    this.paces = BotPaceModel.paces(mapId, pack);
    this.metres = this.paces.map(() => 0);
  }

  advance(second: number): readonly FieldPosition[] {
    for (; this.second < second; this.second++)
      this.paces.forEach((pace, i) => {
        this.metres[i]! += VirtualSpeedModel.speedMs(BotPaceModel.watts(pace, this.second));
      });
    return this.paces.map((pace, i) => ({
      id: pace.name.toLowerCase(),
      name: `Pacer ${pace.name}`,
      jersey: pace.name.toLowerCase(),
      bot: true,
      metres: this.metres[i]!,
    }));
  }
}

import type { GhostTrace } from '@telo/api';
import type { FieldPosition, RaceField } from './race-field';
import { VirtualSpeedModel } from './virtual-speed-model';
import { PACK_BASE_WATTS } from './bot-pace-model';

/**
 * The ghost of a solo race (L2-067 AC2): it replays the rider's best ride on the map second by second, holding its
 * last distance once the trace ends. With no best it rides the medium pace, 190 W, steady (L2-050 AC4).
 */
export class GhostReplay implements RaceField {
  constructor(private readonly trace: GhostTrace | null) {}

  advance(second: number): readonly FieldPosition[] {
    return [
      {
        id: 'ghost',
        name: 'Your best',
        jersey: 'ghost',
        bot: false,
        metres: this.metresAt(second),
      },
    ];
  }

  private metresAt(second: number): number {
    const trace = this.trace;
    if (!trace || trace.length === 0)
      return second * VirtualSpeedModel.speedMs(PACK_BASE_WATTS.medium);
    const at = Math.min(Math.max(Math.floor(second), 0), trace.length - 1);
    return trace[at]!;
  }
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { LobbySeat } from '@telo/api';

/**
 * The start grid (design-system block start-grid, L2-052): "Start grid" with the seats taken over ten, then the ten
 * seats in order. You first with the rider's level; a rider online with their jersey, country and level; a bot with a
 * bot icon and "Bot"; an empty seat "Open seat". A ready seat carries a check named "Ready". Names are data, rendered as
 * text. It only draws what it is given.
 */
@Component({
  selector: 'wz-start-grid',
  templateUrl: './start-grid.html',
  styleUrl: './start-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartGrid {
  readonly seats = input.required<readonly LobbySeat[]>();
  /** The seats taken, by the rider, riders online or bots. */
  protected readonly taken = computed(
    () => this.seats().filter((seat) => seat.kind !== 'open').length,
  );
}

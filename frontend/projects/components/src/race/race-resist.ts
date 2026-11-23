import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * The race's resistance panel (design-system block race-resist, docs/mocks/pages/race/): the bike's resistance
 * ("24", "Resistance / 32", a dash before the bike reports one) between 48 px "Lower resistance" and "Raise resistance"
 * buttons (L2-063 AC1, L2-028), disabled while the bike cannot be controlled. Shown from lg.
 */
@Component({
  selector: 'wz-race-resist',
  templateUrl: './race-resist.html',
  styleUrl: './race-resist.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceResist {
  /** The bike's reported resistance, or `null` before any. */
  readonly level = input.required<number | null>();
  readonly max = input(32);
  readonly disabled = input(false);
  readonly lower = output<void>();
  readonly raise = output<void>();

  protected readonly reads = computed(() => {
    const level = this.level();
    return level === null ? 'unknown' : `${level} of ${this.max()}`;
  });
}

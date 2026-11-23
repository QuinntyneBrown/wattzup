import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * The resistance stepper (design-system block class-resist): the bike's resistance "6 / of 32", or a dash before the
 * bike reports one, between 48 px "Lower resistance" and "Raise resistance" buttons (L2-089 AC4, L2-026, L2-028). The
 * buttons are disabled while the bike cannot be controlled.
 */
@Component({
  selector: 'wz-class-resist',
  templateUrl: './class-resist.html',
  styleUrl: './class-resist.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassResist {
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

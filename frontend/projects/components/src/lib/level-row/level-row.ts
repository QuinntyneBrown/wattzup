import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

export type LevelRowName = 'Work' | 'Recover' | 'Steady';

/**
 * One resistance row of the class page: Lower, the level out of 32 (announced politely), Raise
 * (L2-080 criteria 7, 8 and 15).
 */
@Component({
  selector: 'wz-level-row',
  imports: [Icon],
  templateUrl: './level-row.html',
  styleUrl: './level-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelRow {
  readonly name = input.required<LevelRowName>();
  readonly level = input.required<number>();
  readonly canLower = input(true);
  readonly canRaise = input(true);
  readonly step = output<1 | -1>();

  protected readonly lower = computed(() => this.name().toLowerCase());
  protected readonly swatch = computed(() =>
    this.name() === 'Recover' ? 'rest' : this.name() === 'Work' ? 'work' : 'steady',
  );
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type LevelSliderVariant = 'work' | 'rest' | 'large';

let nextId = 0;

/**
 * A resistance level slider (design-system block level-slider, L2-096 AC1, L2-097 AC1): its label, "24 / 32", a range
 * from 1 to 32 and "Light … Max". The rest variant is tinted for recovery; the large one is flat resistance's.
 */
@Component({
  selector: 'wz-level-slider',
  templateUrl: './level-slider.html',
  styleUrl: './level-slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'level-slider',
    '[class.level-slider--rest]': "variant() === 'rest'",
    '[class.level-slider--large]': "variant() === 'large'",
  },
})
export class LevelSlider {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly variant = input<LevelSliderVariant>('work');
  readonly max = input(32);
  readonly changed = output<number>();
  protected readonly id = `level-slider-${nextId++}`;

  protected change(event: Event): void {
    this.changed.emit(Number((event.target as HTMLInputElement).value));
  }
}

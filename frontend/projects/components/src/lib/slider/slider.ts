import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/**
 * A range with its value beside the label (block `level-slider`). A level is 1–32 with
 * `<n> / 32` (L2-029); other ranges, such as ride sound's volume (L2-129), set their own bounds,
 * suffix, scale and value text.
 */
@Component({
  selector: 'wz-slider',
  templateUrl: './slider.html',
  styleUrl: './slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Slider {
  readonly fieldId = input.required<string>();
  readonly label = input.required<string>();
  readonly level = model.required<number>();
  readonly tone = input<'work' | 'rest'>('work');
  readonly large = input(false);
  readonly disabled = input(false);
  readonly min = input(1);
  readonly max = input(32);
  readonly step = input(1);
  /** Shown small after the value. */
  readonly suffix = input(' / 32');
  /** The words under each end. */
  readonly scale = input<readonly [string, string]>(['Light', 'Max']);
  /** What a screen reader says for the value, such as `60 percent`; the number when null. */
  readonly valueText = input<string | null>(null);

  protected onInput(event: Event): void {
    this.level.set(Number((event.target as HTMLInputElement).value));
  }
}

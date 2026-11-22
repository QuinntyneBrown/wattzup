import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * A progress bar (design-system block progress): a track filled to `value` (0 to 100), a `progressbar` named by `label`
 * with its value for a screen reader. `lg` is the load card's taller bar; `ok` fills it green when the load is done.
 */
@Component({
  selector: 'wz-progress',
  templateUrl: './progress.html',
  styleUrl: './progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'progress',
    '[class.progress--lg]': "size() === 'lg'",
    '[class.progress--ok]': "tone() === 'ok'",
    '[style.--value]': 'fill()',
  },
})
export class Progress {
  readonly value = input.required<number>();
  readonly label = input.required<string>();
  readonly size = input<'md' | 'lg'>('md');
  readonly tone = input<'ok' | null>(null);

  protected readonly fill = computed(() => `${this.value()}%`);
}

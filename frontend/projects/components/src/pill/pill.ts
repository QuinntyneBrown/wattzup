import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A short fact in a rounded tag (design-system block pill): the load card's bike, quality and graphics API. `ok` is the
 * green of a connected bike, `heart` the red of a missing one (World loading's No bike, L2-157 AC1); the words carry the fact, so the tone never does alone.
 */
@Component({
  selector: 'span[wz-pill]',
  templateUrl: './pill.html',
  styleUrl: './pill.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pill',
    '[class.pill--ok]': "tone() === 'ok'",
    '[class.pill--heart]': "tone() === 'heart'",
    '[class.pill--volt]': "tone() === 'volt'",
  },
})
export class Pill {
  readonly tone = input<'ok' | 'heart' | 'volt' | null>(null);
}
